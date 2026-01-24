import { Injectable, Logger, Inject } from '@nestjs/common'
import { SessionsRepository } from './sessions.repository'
import { AuditService } from '../audit/audit.service'
import { v4 as uuidv4 } from 'uuid'
import { hashToken, hashWithKeys } from '../../utils/token.util'
import { ConfigService } from '../../config/config.service'
import { KeyManager } from '../../utils/key.manager'

@Injectable()
export class SessionsService {
    private logger = new Logger(SessionsService.name)
    constructor(
        @Inject('SESSIONS_REPOSITORY') private repo: SessionsRepository,
        private config: ConfigService,
        private audit: AuditService
    ) {}

    async createSession(
        userId: string,
        rawRefreshToken: string,
        deviceInfo: any,
        ipAddress: string,
        ttlSeconds: number
    ) {
        const sessionId = uuidv4()
        // use KeyManager if available for hashing, otherwise fallback to simple HMAC
        let tokenHash = ''
        try {
            const km = new KeyManager(this.config)
            const keys = km.all()
            tokenHash = hashWithKeys(rawRefreshToken, keys).hash
        } catch {
            const hmac = this.config.get('HMAC_SECRET')
            tokenHash = hashToken(rawRefreshToken, hmac)
        }
        const expiresAt = new Date(Date.now() + ttlSeconds * 1000)
        const extractJti = (tok?: string) => {
            try {
                if (!tok) return null
                const parts = tok.split('.')
                if (parts.length < 2) return null
                const payload = JSON.parse(
                    Buffer.from(parts[1], 'base64').toString('utf8')
                )
                return payload.jti || null
            } catch {
                return null
            }
        }
        const jti = extractJti(rawRefreshToken)

        const rec = await this.repo.create({
            id: sessionId,
            userId,
            refreshTokenHash: tokenHash,
            deviceInfo,
            ipAddress,
            expiresAt,
            refreshTokenJti: jti,
        } as any)
        return { sessionId: rec.id, issuedAt: rec.createdAt, expiresAt }
    }

    async rotate(
        sessionId: string,
        rawIncoming: string,
        rawNew: string,
        newTtlSeconds: number
    ) {
        // debug logs removed
        const hmac = this.config.get('HMAC_SECRET')
        // Backwards-compatible: if a KeyManager is available, use primary key for hashing
        let incomingHash = ''
        let newHash = ''
        // extract jti from JWT payloads if present (best-effort, not verifying signature)
        const extractJti = (tok?: string) => {
            try {
                if (!tok) return null
                const parts = tok.split('.')
                if (parts.length < 2) return null
                const payload = JSON.parse(
                    Buffer.from(parts[1], 'base64').toString('utf8')
                )
                return payload.jti || null
            } catch {
                return null
            }
        }
        const incomingJti = extractJti(rawIncoming)
        try {
            const km = new KeyManager(this.config)
            const keys = km.all()
            incomingHash = hashWithKeys(rawIncoming, keys).hash
            newHash = hashWithKeys(rawNew, keys).hash
        } catch {
            incomingHash = hashToken(rawIncoming, hmac)
            newHash = hashToken(rawNew, hmac)
        }
        const newExpiresAt = new Date(Date.now() + newTtlSeconds * 1000)

        const res = await this.repo.rotateRefreshToken(
            sessionId,
            incomingHash,
            newHash,
            newExpiresAt,
            incomingJti
        )
        // debug logs removed
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
                    await this.audit.log('token_reuse_detected', res.userId, {
                        reason: 'previous_token_reused',
                    })
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

    async findById(sessionId: string) {
        return await this.repo.findById(sessionId)
    }
}
