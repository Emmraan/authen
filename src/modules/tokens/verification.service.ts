import { Injectable } from '@nestjs/common'
import { ConfigService } from '../../config/config.service'
import {
    VerificationTokenRecord,
    VerificationTokenType,
} from './tokens.repository'
import { InMemoryTokensRepository } from './in-memory.tokens.repository'
import { generateRawToken, hashToken } from '../../utils/token.util'

@Injectable()
export class VerificationService {
    constructor(
        private repo: InMemoryTokensRepository,
        private config: ConfigService
    ) {}

    async createVerificationToken(
        userId: string,
        type: VerificationTokenType,
        ttlSeconds: number
    ): Promise<{ rawToken: string; expiresAt: Date }> {
        const raw = generateRawToken(48)
        const hmacKey = this.config.get('HMAC_SECRET')
        const tokenHash = hashToken(raw, hmacKey)
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

        // delete any previous tokens for this user/type so resend invalidates old tokens
        try {
            await (this.repo as any).deleteVerificationTokensForUser(userId, type)
        } catch {
            // ignore if repository doesn't implement; best-effort
        }

        await this.repo.createVerificationToken({
            userId,
            tokenHash,
            type,
            expiresAt,
        })

        // Return raw for email delivery; do not log or persist raw value
        return { rawToken: raw, expiresAt }
    }

    async verifyToken(
        rawToken: string,
        type: VerificationTokenType
    ): Promise<VerificationTokenRecord> {
        const hmacKey = this.config.get('HMAC_SECRET')
        const tokenHash = hashToken(rawToken, hmacKey)

        const tokenRecord = await this.repo.findVerificationTokenByHash(
            tokenHash,
            type
        )
        if (!tokenRecord) throw new Error('invalid_or_not_found')
        if (tokenRecord.usedAt) throw new Error('token_already_used')
        if (tokenRecord.expiresAt.getTime() < Date.now())
            throw new Error('token_expired')

        await this.repo.markVerificationTokenUsed(tokenRecord.id)
        return tokenRecord
    }
}
