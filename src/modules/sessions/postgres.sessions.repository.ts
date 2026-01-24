import { SessionsRepository, SessionRecord } from './sessions.repository'

export class PostgresSessionsRepository implements SessionsRepository {
    constructor(private pool: any) {}

    async create(session: {
        id: string
        userId: string
        refreshTokenHash: string
        deviceInfo?: any
        ipAddress?: string
        expiresAt: Date
    }): Promise<SessionRecord> {
        const res = await this.pool.query(
            `INSERT INTO sessions (id, user_id, refresh_token_hash, device_info, ip_address, expires_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING id, user_id as "userId", refresh_token_hash as "refreshTokenHash", previous_refresh_token_hash as "previousRefreshTokenHash", device_info as "deviceInfo", ip_address as "ipAddress", created_at as "createdAt", last_used_at as "lastUsedAt", expires_at as "expiresAt", revoked_at as "revokedAt", revoked_reason as "revokedReason"`,
            [
                session.id,
                session.userId,
                session.refreshTokenHash,
                session.deviceInfo || null,
                session.ipAddress || null,
                session.expiresAt,
            ]
        )
        return res.rows[0]
    }

    async findById(id: string): Promise<SessionRecord | null> {
        const res = await this.pool.query(
            `SELECT id, user_id as "userId", refresh_token_hash as "refreshTokenHash", previous_refresh_token_hash as "previousRefreshTokenHash", device_info as "deviceInfo", ip_address as "ipAddress", created_at as "createdAt", last_used_at as "lastUsedAt", expires_at as "expiresAt", revoked_at as "revokedAt", revoked_reason as "revokedReason" FROM sessions WHERE id = $1 LIMIT 1`,
            [id]
        )
        return res.rows[0] || null
    }

    async rotateRefreshToken(
        sessionId: string,
        incomingHash: string,
        newHash: string,
        newExpiresAt: Date,
        incomingJti?: string | null
    ): Promise<{
        success: boolean
        userId?: string
        previousHash?: string | null
        previousJti?: string | null
    }> {
        // Atomic compare-and-swap: ensure refresh_token_hash matches incomingHash and not revoked
        const res = await this.pool.query(
            `UPDATE sessions
       SET previous_refresh_token_hash = refresh_token_hash,
           previous_refresh_token_jti = $5,
           refresh_token_hash = $1,
           last_used_at = now(),
           expires_at = $2
       WHERE id = $3 AND refresh_token_hash = $4 AND revoked_at IS NULL
    RETURNING user_id as "userId", previous_refresh_token_hash as "previousHash", previous_refresh_token_jti as "previousJti"`,
            [
                newHash,
                newExpiresAt,
                sessionId,
                incomingHash,
                incomingJti || null,
            ]
        )

        if (res.rowCount === 1)
            return {
                success: true,
                userId: res.rows[0].userId,
                previousHash: res.rows[0].previousHash,
                previousJti: res.rows[0].previousJti ?? null,
            }

        // No rows updated -> either mismatch or revoked
        // Fetch row to inspect previous_refresh_token_hash for reuse detection
        const r2 = await this.pool.query(
            `SELECT user_id as "userId", previous_refresh_token_hash as "previousHash", previous_refresh_token_jti as "previousJti", refresh_token_hash as "currentHash", revoked_at FROM sessions WHERE id = $1 LIMIT 1`,
            [sessionId]
        )
        const row = r2.rows[0]
        if (!row) return { success: false }
        return {
            success: false,
            userId: row.userId,
            previousHash: row.previousHash ?? null,
            previousJti: row.previousJti ?? null,
        }
    }

    async revokeSession(sessionId: string, reason?: string): Promise<void> {
        await this.pool.query(
            `UPDATE sessions SET revoked_at = now(), revoked_reason = $2 WHERE id = $1`,
            [sessionId, reason || null]
        )
    }

    async revokeAllForUser(userId: string, reason?: string): Promise<number> {
        const res = await this.pool.query(
            `UPDATE sessions SET revoked_at = now(), revoked_reason = $2 WHERE user_id = $1 AND revoked_at IS NULL RETURNING id`,
            [userId, reason || null]
        )
        return res.rowCount
    }

    async listSessionsForUser(userId: string): Promise<SessionRecord[]> {
        const res = await this.pool.query(
            `SELECT id, user_id as "userId", refresh_token_hash as "refreshTokenHash", previous_refresh_token_hash as "previousRefreshTokenHash", device_info as "deviceInfo", ip_address as "ipAddress", created_at as "createdAt", last_used_at as "lastUsedAt", expires_at as "expiresAt", revoked_at as "revokedAt", revoked_reason as "revokedReason" FROM sessions WHERE user_id = $1`,
            [userId]
        )
        return res.rows
    }
}
