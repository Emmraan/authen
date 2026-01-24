/* eslint-disable @typescript-eslint/no-require-imports */
let IORedis: any = null
try {
    IORedis = require('ioredis')
} catch {
    IORedis = null
}
let _warnSpy: jest.SpyInstance | null = null
import { slidingWindowLimit } from '../../src/utils/rate-limit.util'
import { RateLimitMiddleware } from '../../src/middleware/rate-limit.middleware'

const REDIS_URL = process.env.RATE_LIMIT_REDIS_URL || 'redis://127.0.0.1:6379'

describe('Rate limiter integration (Redis)', () => {
    let redis: any = null

    beforeAll(async () => {
        // suppress expected warning when ioredis isn't installed in the environment
        _warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})
        if (!IORedis) {
            console.warn(
                'ioredis module not installed; skipping Redis integration tests'
            )
            redis = null
            return
        }
        redis = new IORedis(REDIS_URL)
        try {
            await redis.ping()
        } catch (err) {
            console.warn(
                'Redis not available at',
                REDIS_URL,
                '- skipping integration tests',
                err
            )
            await redis.disconnect().catch(() => {})
            // mark redis as null to signal skipping
            redis = null
        }
    })

    beforeEach(async () => {
        if (redis) await redis.flushdb()
    })

    afterAll(async () => {
        if (redis) await redis.disconnect()
        if (_warnSpy) _warnSpy.mockRestore()
    })

    test('slidingWindowLimit allows under limit and blocks after limit', async () => {
        if (!redis) return // skip
        const key = 'rl:test:sliding'
        const limit = 2
        const windowMs = 1000

        for (let i = 0; i < limit; i++) {
            const res = await slidingWindowLimit(
                redis,
                key,
                limit,
                windowMs,
                `m${i}`
            )
            expect(res.allowed).toBe(true)
        }

        const res2 = await slidingWindowLimit(redis, key, limit, windowMs, `m2`)
        expect(res2.allowed).toBe(false)
    })

    test('RateLimitMiddleware blocks after account limit', async () => {
        if (!redis) return // skip
        const middleware = new RateLimitMiddleware(redis)
        const reqBase: any = {
            headers: {},
            ip: '127.0.0.1',
            path: '/auth/login',
            originalUrl: '/auth/login',
            body: { email: 'test@example.com' },
            connection: { remoteAddress: '127.0.0.1' },
        }

        const makeRes = () => {
            let statusCode = 200
            let body: any = null
            return {
                setHeader: () => {},
                status: (code: number) => {
                    statusCode = code
                    return {
                        json: (b: any) => {
                            body = b
                            return null
                        },
                    }
                },
                _getStatus: () => statusCode,
                _getBody: () => body,
            } as any
        }

        const next = jest.fn()

        // default account limit is 5; set up to 2 by calling slidingWindowLimit directly first
        // perform two allowed requests
        for (let i = 0; i < 2; i++) {
            const req = { ...reqBase }
            const res = makeRes()
            await middleware.use(req, res, next as any)
            expect(res._getStatus()).not.toBe(429)
        }

        // saturate up to account limit by calling additional times until blocked
        let blocked = false
        for (let i = 0; i < 10; i++) {
            const req = { ...reqBase }
            const res = makeRes()
            await middleware.use(req, res, next as any)
            if (res._getStatus() === 429) {
                blocked = true
                break
            }
        }
        expect(blocked).toBe(true)
    })
})
