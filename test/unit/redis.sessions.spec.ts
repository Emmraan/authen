import { RedisSessionsRepository } from '../../src/modules/sessions/redis.sessions.repository'

describe('RedisSessionsRepository', () => {
    const future = new Date(Date.now() + 60 * 60 * 1000)
    const userId = 'user-1'
    const sessionId = 'sess-1'

    function makeMockClient() {
        const store: Record<string, any> = {}
        return {
            async hset(key: string, ...args: any[]) {
                if (!store[key]) store[key] = {}
                for (let i = 0; i < args.length; i += 2) {
                    store[key][args[i]] = args[i + 1]
                }
                return true
            },
            async hgetall(key: string) {
                return store[key] || {}
            },
            async sadd(key: string, member: string) {
                if (!store[key]) store[key] = new Set()
                store[key].add(member)
                return 1
            },
            async smembers(key: string) {
                if (!store[key]) return []
                return Array.from(store[key])
            },
            async expire() {
                return 1
            },
            async pipeline() {
                const ops: any[] = []
                return {
                    hgetall: (k: string) => ops.push(['hgetall', k]) && this,
                    hset: (k: string, ...a: any[]) =>
                        ops.push(['hset', k, a]) && this,
                    exec: async () => {
                        const res: any[] = []
                        for (const op of ops) {
                            if (op[0] === 'hgetall')
                                res.push([null, store[op[1]] || {}])
                            else if (op[0] === 'hset') {
                                const key = op[1]
                                const args = op[2]
                                if (!store[key]) store[key] = {}
                                for (let i = 0; i < args.length; i += 2)
                                    store[key][args[i]] = args[i + 1]
                                res.push([null, 'OK'])
                            }
                        }
                        return res
                    },
                }
            },
            async eval(
                _s: string,
                _n: number,
                key: string,
                incoming: string,
                newh: string,
                expiresAt: string
            ) {
                const d = store[key] || {}
                const revoked = d.revokedAt
                if (revoked && revoked !== '')
                    return [
                        0,
                        d.userId || null,
                        d.previousRefreshTokenHash || null,
                    ]
                const current = d.refreshTokenHash || ''
                if (current === incoming) {
                    const prev = current
                    d.previousRefreshTokenHash = prev
                    d.refreshTokenHash = newh
                    d.lastUsedAt = new Date().toISOString()
                    d.expiresAt = expiresAt
                    store[key] = d
                    return [1, d.userId || null, prev]
                }
                return [0, d.userId || null, d.previousRefreshTokenHash || null]
            },
        }
    }

    test('create and find', async () => {
        const client = makeMockClient()
        const repo = new RedisSessionsRepository(client as any)
        await repo.create({
            id: sessionId,
            userId,
            refreshTokenHash: 'h1',
            expiresAt: future,
        })
        const found = await repo.findById(sessionId)
        expect(found).not.toBeNull()
        expect(found!.userId).toBe(userId)
    })

    test('rotate success', async () => {
        const client = makeMockClient()
        const repo = new RedisSessionsRepository(client as any)
        await repo.create({
            id: sessionId,
            userId,
            refreshTokenHash: 'h1',
            expiresAt: future,
        })
        const res = await repo.rotateRefreshToken(sessionId, 'h1', 'h2', future)
        expect(res.success).toBe(true)
        expect(res.userId).toBe(userId)
    })

    test('rotate failure with previousHash', async () => {
        const client = makeMockClient()
        const repo = new RedisSessionsRepository(client as any)
        // seed with different current
        await client.hset(
            `session:${sessionId}`,
            'id',
            sessionId,
            'userId',
            userId,
            'refreshTokenHash',
            'h0'
        )
        const res = await repo.rotateRefreshToken(sessionId, 'h1', 'h2', future)
        expect(res.success).toBe(false)
        expect(
            res.previousHash === null || typeof res.previousHash === 'string'
        ).toBe(true)
    })
})
