import {
    TokensRepository,
    VerificationTokenRecord,
    VerificationTokenType,
} from './tokens.repository'

export class PostgresTokensRepository implements TokensRepository {
    constructor(private pool: any) {}

    async createVerificationToken(params: {
        userId: string
        tokenHash: string
        type: VerificationTokenType
        expiresAt: Date
    }): Promise<VerificationTokenRecord> {
        const { userId, tokenHash, type, expiresAt } = params
        const result = await this.pool.query(
            `INSERT INTO verification_tokens (user_id, token_hash, type, expires_at)
			 VALUES ($1,$2,$3,$4)
			 RETURNING id, user_id as "userId", token_hash as "tokenHash", type, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"`,
            [userId, tokenHash, type, expiresAt]
        )
        return result.rows[0]
    }

    async findVerificationTokenByHash(
        tokenHash: string,
        type: VerificationTokenType
    ): Promise<VerificationTokenRecord | null> {
        const result = await this.pool.query(
            `SELECT id, user_id as "userId", token_hash as "tokenHash", type, expires_at as "expiresAt", used_at as "usedAt", created_at as "createdAt"
			 FROM verification_tokens
			 WHERE token_hash = $1 AND type = $2
			 LIMIT 1`,
            [tokenHash, type]
        )
        return result.rows[0] || null
    }

    async markVerificationTokenUsed(id: string): Promise<void> {
        await this.pool.query(
            `UPDATE verification_tokens SET used_at = now() WHERE id = $1`,
            [id]
        )
    }

    async deleteExpiredVerificationTokens(cutoff: Date): Promise<number> {
        const res = await this.pool.query(
            `DELETE FROM verification_tokens WHERE expires_at < $1 RETURNING id`,
            [cutoff]
        )
        return res.rowCount
    }
}
