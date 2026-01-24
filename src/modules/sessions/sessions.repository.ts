export interface SessionRecord {
    id: string
    userId: string
    refreshTokenHash: string
    previousRefreshTokenHash?: string | null
    deviceInfo?: any
    ipAddress?: string
    createdAt: Date
    lastUsedAt?: Date | null
    expiresAt: Date
    revokedAt?: Date | null
    revokedReason?: string | null
}

export interface SessionsRepository {
    create(session: {
        id: string
        userId: string
        refreshTokenHash: string
        deviceInfo?: any
        ipAddress?: string
        expiresAt: Date
    }): Promise<SessionRecord>

    findById(id: string): Promise<SessionRecord | null>

    rotateRefreshToken(
        sessionId: string,
        incomingHash: string,
        newHash: string,
        newExpiresAt: Date
    ): Promise<{
        success: boolean
        userId?: string
        previousHash?: string | null
    }>

    revokeSession(sessionId: string, reason?: string): Promise<void>

    revokeAllForUser(userId: string, reason?: string): Promise<number>

    listSessionsForUser(userId: string): Promise<SessionRecord[]>
}
