import { Injectable } from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { VerificationTokenRecord, VerificationTokenType } from './tokens.repository'

@Injectable()
export class InMemoryTokensRepository {
    // Map<userId, Set<refreshToken>>
    private store = new Map<string, Set<string>>()

    async add(userId: string, token: string) {
        const set = this.store.get(userId) ?? new Set<string>()
        set.add(token)
        this.store.set(userId, set)
    }

    async remove(userId: string, token: string) {
        const set = this.store.get(userId)
        if (!set) return
        set.delete(token)
        if (set.size === 0) this.store.delete(userId)
    }

    async exists(userId: string, token: string): Promise<boolean> {
        const set = this.store.get(userId)
        return !!set && set.has(token)
    }

    async removeAllForUser(userId: string) {
        this.store.delete(userId)
    }

    // Simple in-memory verification token store
    private verification = new Map<string, VerificationTokenRecord>()

    async createVerificationToken(params: {
        userId: string
        tokenHash: string
        type: VerificationTokenType
        expiresAt: Date
    }): Promise<VerificationTokenRecord> {
        const id = uuidv4()
        const rec: VerificationTokenRecord = {
            id,
            userId: params.userId,
            tokenHash: params.tokenHash,
            type: params.type,
            expiresAt: params.expiresAt,
            createdAt: new Date(),
        }
        this.verification.set(id, rec)
        return rec
    }

    async findVerificationTokenByHash(
        tokenHash: string,
        type: VerificationTokenType
    ): Promise<VerificationTokenRecord | null> {
        for (const v of this.verification.values()) {
            if (v.tokenHash === tokenHash && v.type === type) return v
        }
        return null
    }

    async markVerificationTokenUsed(id: string): Promise<void> {
        const rec = this.verification.get(id)
        if (!rec) return
        rec.usedAt = new Date()
        this.verification.set(id, rec)
    }

    async deleteExpiredVerificationTokens(cutoff: Date): Promise<number> {
        let count = 0
        for (const [id, v] of this.verification.entries()) {
            if (v.expiresAt.getTime() < cutoff.getTime() || v.usedAt) {
                this.verification.delete(id)
                count++
            }
        }
        return count
    }

    async deleteVerificationTokensForUser(
        userId: string,
        type: VerificationTokenType
    ): Promise<number> {
        let count = 0
        for (const [id, v] of this.verification.entries()) {
            if (v.userId === userId && v.type === type) {
                this.verification.delete(id)
                count++
            }
        }
        return count
    }
}
