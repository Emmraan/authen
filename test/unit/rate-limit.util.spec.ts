import {
    InMemoryLimiter,
    slidingWindowLimit,
} from '../../src/utils/rate-limit.util'

// Implement a MockRedis compatible with slidingWindowLimit's usage for tests.
class MockRedis {
    private store = new Map<string, number[]>()

    multi() {
        const store = this.store
        const ops: Array<() => [null, any]> = []
        return {
            zadd(key: string, score: string) {
                ops.push(() => {
                    const arr = store.get(key) ?? []
                    arr.push(Number(score))
                    store.set(key, arr)
                    return [null, 'OK']
                })
                return this
            },
            zremrangebyscore(key: string, max: string) {
                ops.push(() => {
                    const arr = store.get(key) ?? []
                    const maxN = Number(max)
                    const filtered = arr.filter((v) => v > maxN)
                    store.set(key, filtered)
                    return [null, 'OK']
                })
                return this
            },
            zcard(key: string) {
                ops.push(() => {
                    const arr = store.get(key) ?? []
                    return [null, arr.length]
                })
                return this
            },
            expire() {
                ops.push(() => [null, 1])
                return this
            },
            async exec() {
                const results = ops.map((fn) => fn())
                return results
            },
        } as any
    }

    async zrange(key: string) {
        const arr = this.store.get(key) ?? []
        if (arr.length === 0) return []
        // return first element and its score
        const v = arr[0]
        return [String(v), String(v)]
    }
}

describe('InMemoryLimiter', () => {
    it('allows under limit and blocks after limit', async () => {
        const lim = new InMemoryLimiter()
        const key = 'test:ip'
        const windowMs = 1000
        const limit = 3
        // three requests allowed
        for (let i = 0; i < limit; i++) {
            const r = await lim.limit(key, limit, windowMs)
            expect(r.allowed).toBe(true)
        }
        // fourth request blocked
        const r2 = await lim.limit(key, limit, windowMs)
        expect(r2.allowed).toBe(false)
    })
})

describe('slidingWindowLimit (mock redis)', () => {
    it('allows under limit and blocks after limit', async () => {
        const mock = new MockRedis() as any
        const key = 'rl:test'
        const limit = 2
        const windowMs = 1000

        // call function 2 times -> allowed
        for (let i = 0; i < limit; i++) {
            const res = await slidingWindowLimit(
                mock,
                key,
                limit,
                windowMs,
                `m${i}` as any
            )
            expect(res.allowed).toBe(true)
        }
        // 3rd should be blocked
        const res2 = await slidingWindowLimit(
            mock,
            key,
            limit,
            windowMs,
            'm2' as any
        )
        expect(res2.allowed).toBe(false)
    })
})
