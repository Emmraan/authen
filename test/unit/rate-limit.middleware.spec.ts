import { RateLimitMiddleware } from '../../src/middleware/rate-limit.middleware'

describe('RateLimitMiddleware (in-memory fallback)', () => {
    it('allows non-sensitive paths', async () => {
        const mw = new RateLimitMiddleware(null as any)
        const req: any = {
            headers: {},
            ip: '1.2.3.4',
            path: '/health',
            originalUrl: '/health',
            body: {},
            connection: { remoteAddress: '1.2.3.4' },
        }
        const res: any = {
            setHeader: () => {},
            status: () => ({ json: () => {} }),
        }
        const next = jest.fn()
        await mw.use(req, res, next as any)
        expect(next).toHaveBeenCalled()
    })

    it('blocks after account limit using in-memory limiter', async () => {
        const mw = new RateLimitMiddleware(null as any)
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
                setHeader: (_k: string, _v: any) => {
                    void _k
                    void _v
                },
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

        // call more times than default acct limit (5) to trigger block
        let blocked = false
        for (let i = 0; i < 10; i++) {
            const req = { ...reqBase }
            const res = makeRes()
            await mw.use(req, res, next as any)
            if (res._getStatus() === 429) {
                blocked = true
                break
            }
        }
        expect(blocked).toBe(true)
    })
})
