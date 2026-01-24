import { SessionsRepository, SessionRecord } from './sessions.repository'

export class InMemorySessionsRepository implements SessionsRepository {
    private store = new Map<string, SessionRecord>()
    private userIndex = new Map<string, Set<string>>()

    async create(session: {
        id: string
        userId: string
        refreshTokenHash: string
        deviceInfo?: any
        ipAddress?: string
        expiresAt: Date
        refreshTokenJti?: string | null
    }): Promise<SessionRecord> {
        const rec: any = {
            id: session.id,
            userId: session.userId,
            refreshTokenHash: session.refreshTokenHash,
            previousRefreshTokenHash: null,
            refreshTokenJti: (session as any).refreshTokenJti || null,
            previousRefreshTokenJti: null,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            createdAt: new Date(),
            lastUsedAt: null,
            expiresAt: session.expiresAt,
            revokedAt: null,
            revokedReason: null,
        }
        this.store.set(session.id, rec)
        const s = this.userIndex.get(session.userId) ?? new Set<string>()
        s.add(session.id)
        this.userIndex.set(session.userId, s)
        return rec
    }

    async findById(id: string): Promise<SessionRecord | null> {
        return this.store.get(id) || null
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
        const rec = this.store.get(sessionId)
        if (!rec) return { success: false }
        if (rec.revokedAt)
            return {
                success: false,
                userId: rec.userId,
                previousHash: rec.previousRefreshTokenHash ?? null,
                previousJti: (rec as any).previousRefreshTokenJti ?? null,
            }

        // If incoming matches current -> rotate normally
        if (rec.refreshTokenHash === incomingHash) {
            const prev = rec.refreshTokenHash
            const prevJti = (rec as any).refreshTokenJti ?? null
            rec.previousRefreshTokenHash = prev
            ;(rec as any).previousRefreshTokenJti = prevJti
            rec.refreshTokenHash = newHash
            ;(rec as any).refreshTokenJti = newJti || null
            rec.lastUsedAt = new Date()
            rec.expiresAt = newExpiresAt
            this.store.set(sessionId, rec)
            return {
                success: true,
                userId: rec.userId,
                previousHash: prev,
                previousJti: prevJti,
            }
        }

        // Otherwise, return previous info for reuse-detection
        return {
            success: false,
            userId: rec.userId,
            previousHash: rec.previousRefreshTokenHash ?? null,
            previousJti: (rec as any).previousRefreshTokenJti ?? null,
        }
    }

    async revokeSession(sessionId: string, reason?: string): Promise<void> {
        const rec = this.store.get(sessionId)
        if (!rec) return
        rec.revokedAt = new Date()
        rec.revokedReason = reason || null
        this.store.set(sessionId, rec)
    }

    async revokeAllForUser(userId: string, reason?: string): Promise<number> {
        const set = this.userIndex.get(userId)
        if (!set) return 0
        let count = 0
        for (const id of set) {
            const rec = this.store.get(id)
            if (rec && !rec.revokedAt) {
                rec.revokedAt = new Date()
                rec.revokedReason = reason || null
                this.store.set(id, rec)
                count++
            }
        }
        return count
    }

    async listSessionsForUser(userId: string): Promise<SessionRecord[]> {
        const set = this.userIndex.get(userId)
        if (!set) return []
        const out: SessionRecord[] = []
        for (const id of set) {
            const rec = this.store.get(id)
            if (rec) out.push(rec)
        }
        return out
    }
}
