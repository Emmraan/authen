export type VerificationTokenType = 'email_verify' | 'password_reset'

export interface VerificationTokenRecord {
    id: string
    userId: string
    tokenHash: string
    type: VerificationTokenType
    expiresAt: Date
    usedAt?: Date | null
    createdAt: Date
}

export interface TokensRepository {
    createVerificationToken(record: {
        userId: string
        tokenHash: string
        type: VerificationTokenType
        expiresAt: Date
    }): Promise<VerificationTokenRecord>

    findVerificationTokenByHash(
        tokenHash: string,
        type: VerificationTokenType
    ): Promise<VerificationTokenRecord | null>

    markVerificationTokenUsed(id: string): Promise<void>

    deleteExpiredVerificationTokens(cutoff: Date): Promise<number>
    deleteVerificationTokensForUser(
        userId: string,
        type: VerificationTokenType
    ): Promise<number>
}
