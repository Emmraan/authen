import { SessionsRepository, SessionRecord } from './sessions.repository'

export class RedisSessionsRepository implements SessionsRepository {
    constructor(private client: any) {}

    async create(session: {
        id: string
        userId: string
        refreshTokenHash: string
        deviceInfo?: any
        ipAddress?: string
        expiresAt: Date
    }): Promise<SessionRecord> {
        const key = `session:${session.id}`
        const now = new Date().toISOString()
        const expiresAtIso = session.expiresAt.toISOString()
        const fields: Record<string, string> = {
            id: session.id,
            userId: session.userId,
            refreshTokenHash: session.refreshTokenHash,
            deviceInfo: session.deviceInfo
                ? JSON.stringify(session.deviceInfo)
                : '',
            ipAddress: session.ipAddress || '',
            createdAt: now,
            lastUsedAt: '',
            expiresAt: expiresAtIso,
            revokedAt: '',
            revokedReason: '',
            previousRefreshTokenHash: '',
            refreshTokenJti: (session as any).refreshTokenJti || '',
            previousRefreshTokenJti: '',
        }
        const args: Array<string> = []
        for (const k of Object.keys(fields)) {
            args.push(k, fields[k])
        }
        // include refreshTokenJti if provided
        if ((fields as any).refreshTokenJti) {
            args.push('refreshTokenJti', (fields as any).refreshTokenJti)
        }
        await this.client.hset(key, ...args)
        // add to user's set for listing
        await this.client.sadd(`user_sessions:${session.userId}`, session.id)
        // set TTL to match expiry
        const ttlSeconds = Math.max(
            0,
            Math.floor((session.expiresAt.getTime() - Date.now()) / 1000)
        )
        if (ttlSeconds > 0) await this.client.expire(key, ttlSeconds)
        return {
            id: session.id,
            userId: session.userId,
            refreshTokenHash: session.refreshTokenHash,
            previousRefreshTokenHash: null,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            createdAt: new Date(now),
            lastUsedAt: null,
            expiresAt: session.expiresAt,
            revokedAt: null,
            revokedReason: null,
        }
    }

    async findById(id: string): Promise<SessionRecord | null> {
        const key = `session:${id}`
        const data = await this.client.hgetall(key)
        if (!data || Object.keys(data).length === 0) return null
        return {
            id: data.id,
            userId: data.userId,
            refreshTokenHash: data.refreshTokenHash,
            previousRefreshTokenHash: data.previousRefreshTokenHash || null,
            deviceInfo: data.deviceInfo
                ? JSON.parse(data.deviceInfo)
                : undefined,
            ipAddress: data.ipAddress || undefined,
            createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
            lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt) : new Date(),
            revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
            revokedReason: data.revokedReason || null,
        }
    }

    async rotateRefreshToken(
        sessionId: string,
        incomingHash: string,
        newHash: string,
        newExpiresAt: Date,
        incomingJti?: string | null,
        newJti?: string | null
    ): Promise<{
        success: boolean
        userId?: string
        previousHash?: string | null
        previousJti?: string | null
    }> {
        const key = `session:${sessionId}`
        // Lua script: compare current refreshTokenHash to incomingHash and swap atomically
        const script = `
local key=KEYS[1]
local incoming=ARGV[1]
local newhash=ARGV[2]
local expiresAt=ARGV[3]
local now=ARGV[4]
local current = redis.call('HGET', key, 'refreshTokenHash')
local revoked = redis.call('HGET', key, 'revokedAt')
if revoked and revoked ~= '' then
  return {0, redis.call('HGET', key, 'userId'), redis.call('HGET', key, 'previousRefreshTokenHash')}
end
if current == incoming then
    local prev = current
    local prevjti = redis.call('HGET', key, 'refreshTokenJti') or ''
    redis.call('HSET', key, 'previousRefreshTokenHash', prev, 'previousRefreshTokenJti', prevjti, 'refreshTokenHash', newhash, 'refreshTokenJti', ARGV[5] or '', 'lastUsedAt', now, 'expiresAt', expiresAt)
    return {1, redis.call('HGET', key, 'userId'), prev, prevjti}
else
    return {0, redis.call('HGET', key, 'userId'), redis.call('HGET', key, 'previousRefreshTokenHash'), redis.call('HGET', key, 'previousRefreshTokenJti')}
end
`
        const res: any = await this.client.eval(
            script,
            1,
            key,
            incomingHash,
            newHash,
            newExpiresAt.toISOString(),
            new Date().toISOString(),
            newJti || ''
        )
        // res is an array: [successFlagNumber, userId, previousHash]
        if (!res) return { success: false }
        const success = Number(res[0]) === 1
        return {
            success,
            userId: res[1] || undefined,
            previousHash: res[2] && res[2] !== '' ? res[2] : null,
            previousJti: res[3] && res[3] !== '' ? res[3] : null,
        }
    }

    async revokeSession(sessionId: string, reason?: string): Promise<void> {
        const key = `session:${sessionId}`
        await this.client.hset(
            key,
            'revokedAt',
            new Date().toISOString(),
            'revokedReason',
            reason || ''
        )
    }

    async revokeAllForUser(userId: string, reason?: string): Promise<number> {
        const setKey = `user_sessions:${userId}`
        const members = await this.client.smembers(setKey)
        if (!members || members.length === 0) return 0
        const pipeline = this.client.pipeline()
        for (const id of members) {
            pipeline.hset(
                `session:${id}`,
                'revokedAt',
                new Date().toISOString(),
                'revokedReason',
                reason || ''
            )
        }
        await pipeline.exec()
        return members.length
    }

    async listSessionsForUser(userId: string): Promise<SessionRecord[]> {
        const setKey = `user_sessions:${userId}`
        const members = await this.client.smembers(setKey)
        if (!members || members.length === 0) return []
        const pipeline = this.client.pipeline()
        for (const id of members) pipeline.hgetall(`session:${id}`)
        const results = await pipeline.exec()
        // results: array of [err, res]
        const out: SessionRecord[] = []
        for (const r of results) {
            const data = r[1]
            if (!data) continue
            out.push({
                id: data.id,
                userId: data.userId,
                refreshTokenHash: data.refreshTokenHash,
                previousRefreshTokenHash: data.previousRefreshTokenHash || null,
                deviceInfo: data.deviceInfo
                    ? JSON.parse(data.deviceInfo)
                    : undefined,
                ipAddress: data.ipAddress || undefined,
                createdAt: data.createdAt
                    ? new Date(data.createdAt)
                    : new Date(),
                lastUsedAt: data.lastUsedAt ? new Date(data.lastUsedAt) : null,
                expiresAt: data.expiresAt
                    ? new Date(data.expiresAt)
                    : new Date(),
                revokedAt: data.revokedAt ? new Date(data.revokedAt) : null,
                revokedReason: data.revokedReason || null,
            })
        }
        return out
    }
}
