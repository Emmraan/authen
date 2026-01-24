import { Injectable, Logger, Inject } from '@nestjs/common'
import { SessionsRepository } from './sessions.repository'
import { v4 as uuidv4 } from 'uuid'
import { hashToken } from '../../utils/token.util'
import { ConfigService } from '../../config/config.service'

@Injectable()
export class SessionsService {
    private logger = new Logger(SessionsService.name)
    constructor(
        @Inject('SESSIONS_REPOSITORY') private repo: SessionsRepository,
        private config: ConfigService
    ) {}

    async createSession(
        userId: string,
        rawRefreshToken: string,
        deviceInfo: any,
        ipAddress: string,
        ttlSeconds: number
    ) {
        const sessionId = uuidv4()
        const hmac = this.config.get('HMAC_SECRET')
        const tokenHash = hashToken(rawRefreshToken, hmac)
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

        const rec = await this.repo.create({
            id: sessionId,
            userId,
            refreshTokenHash: tokenHash,
            deviceInfo,
            ipAddress,
            expiresAt,
        })
        return { sessionId: rec.id, issuedAt: rec.createdAt, expiresAt }
    }

    async rotate(
        sessionId: string,
        rawIncoming: string,
        rawNew: string,
        newTtlSeconds: number
    ) {
        const hmac = this.config.get('HMAC_SECRET')
        const incomingHash = hashToken(rawIncoming, hmac)
        const newHash = hashToken(rawNew, hmac)
        const newExpiresAt = new Date(Date.now() + newTtlSeconds * 1000)

        const res = await this.repo.rotateRefreshToken(
            sessionId,
            incomingHash,
            newHash,
            newExpiresAt
        )
        if (res.success) {
            return { rotated: true, userId: res.userId }
        }

        // possible reuse detection
        if (res.previousHash) {
            // if incomingHash equals previousHash -> reuse detected
            const incomingMatchesPrevious =
                res.previousHash && res.previousHash === incomingHash
            if (incomingMatchesPrevious) {
                // revoke all sessions for user
                if (res.userId) {
                    await this.repo.revokeAllForUser(
                        res.userId,
                        'token_reuse_detected'
                    )
                    this.logger.warn(
                        `Token reuse detected for user ${res.userId}. All sessions revoked.`
                    )
                }
            }
        }

        return { rotated: false }
    }

    async revoke(sessionId: string, reason?: string) {
        await this.repo.revokeSession(sessionId, reason)
    }

    async revokeAll(userId: string, reason?: string) {
        return await this.repo.revokeAllForUser(userId, reason)
    }

    async listForUser(userId: string) {
        return await this.repo.listSessionsForUser(userId)
    }
}
