import {
    Injectable,
    UnauthorizedException,
    Logger,
    HttpException,
} from '@nestjs/common'
import { v4 as uuidv4 } from 'uuid'
import { UsersService } from '../users/users.service'
import { TokensService } from '../tokens/tokens.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '../../config/config.service'
import { comparePasswords } from '../../utils/hash.util'
import { SessionsService } from '../sessions/sessions.service'

@Injectable()
export class AuthService {
    private accessSecret: string
    private refreshSecret: string
    private accessExpiresIn: string
    private refreshExpiresIn: string
    private logger = new Logger(AuthService.name)

    constructor(
        private usersService: UsersService,
        private tokensService: TokensService,
        private jwtService: JwtService,
        private config: ConfigService,
        private sessionsService: SessionsService
    ) {
        this.accessSecret = this.config.get(
            'JWT_ACCESS_TOKEN_SECRET',
            'change_me_access'
        )
        this.refreshSecret = this.config.get(
            'JWT_REFRESH_TOKEN_SECRET',
            'change_me_refresh'
        )
        this.accessExpiresIn = this.config.get(
            'JWT_ACCESS_TOKEN_EXPIRES_IN',
            '15m'
        )
        this.refreshExpiresIn = this.config.get(
            'JWT_REFRESH_TOKEN_EXPIRES_IN',
            '7d'
        )
    }

    async signup(email: string, password: string) {
        // UsersService handles hashing internally via create
        const user = await this.usersService.create({ email, password } as any)
        return user
    }

    async validateUser(email: string, password: string) {
        const user = await this.usersService.findByEmail(email)
        if (!user) return null

        // If account is locked, reject early with 423 Locked
        const lockedUntil = (user as any).lockedUntil
        if (lockedUntil && new Date(lockedUntil).getTime() > Date.now()) {
            // Generic message to avoid leaking details
            throw new HttpException('Account locked', 423)
        }

        const isValid = await comparePasswords(password, (user as any).password)
        if (!isValid) {
            // Increment failed attempts; service will set lock if threshold reached
            try {
                await this.usersService.incrementFailedLoginAttempts(
                    (user as any).id
                )
            } catch {
                // ignore errors in increment path
            }
            return null
        }

        // Successful login: reset attempts and clear lock
        try {
            await this.usersService.resetFailedLoginAttempts((user as any).id)
        } catch {
            // ignore
        }
        return user
    }

    private buildAccessTokenPayload(user: any) {
        return { userId: user.id, email: user.email, role: user.role }
    }

    async login(user: any) {
        const payload = this.buildAccessTokenPayload(user)
        const accessToken = this.jwtService.sign(payload, {
            secret: this.accessSecret,
            expiresIn: this.accessExpiresIn,
        })
        const refreshToken = this.jwtService.sign(
            { userId: user.id },
            {
                secret: this.refreshSecret,
                expiresIn: this.refreshExpiresIn,
                jwtid: uuidv4(),
            }
        )
        await this.tokensService.storeRefreshToken(user.id, refreshToken)
        // create a session record for refresh rotation + reuse detection
        try {
            const ttlSeconds = 7 * 24 * 60 * 60
            const sess = await this.sessionsService.createSession(
                user.id,
                refreshToken,
                {},
                '127.0.0.1',
                ttlSeconds
            )
            return { accessToken, refreshToken, sessionId: sess.sessionId }
        } catch {
            return { accessToken, refreshToken }
        }
    }

    async refresh(userId: string, refreshToken: string, sessionId?: string) {
        // verify token signature + existence
        try {
            const decoded: any = this.jwtService.verify(refreshToken, {
                secret: this.refreshSecret,
            })
            if (decoded.userId !== userId)
                throw new UnauthorizedException('Invalid token payload')

            // If sessionId is provided, perform early reuse detection using session metadata
            if (sessionId) {
                try {
                    const sess = await this.sessionsService.findById(
                        sessionId as any
                    )
                    if (sess) {
                        // extract jti from incoming token
                        let incomingJti: string | null = null
                        try {
                            const parts = (refreshToken || '').split('.')
                            if (parts.length >= 2) {
                                const payload = JSON.parse(
                                    Buffer.from(parts[1], 'base64').toString(
                                        'utf8'
                                    )
                                )
                                incomingJti = payload.jti || null
                            }
                        } catch {
                            void 0
                        }
                        // if incoming matches previous jti or previous hash -> treat as reuse
                        if (
                            (sess as any).previousRefreshTokenJti &&
                            incomingJti &&
                            (sess as any).previousRefreshTokenJti ===
                                incomingJti
                        ) {
                            await this.sessionsService.revokeAll(
                                userId,
                                'token_reuse_detected'
                            )
                            throw new UnauthorizedException(
                                'Refresh token reuse detected'
                            )
                        }
                    }
                } catch {
                    // ignore and continue to token store validation
                }
            }

            await this.tokensService.validateRefreshToken(userId, refreshToken)
            const user = await this.usersService.findById(userId)
            const payload = this.buildAccessTokenPayload(user)
            const accessToken = this.jwtService.sign(payload, {
                secret: this.accessSecret,
                expiresIn: this.accessExpiresIn,
            })
            // rotate refresh token: issue new token and attempt session rotate first
            const newRefreshToken = this.jwtService.sign(
                { userId: user.id },
                {
                    secret: this.refreshSecret,
                    expiresIn: this.refreshExpiresIn,
                    jwtid: uuidv4(),
                }
            )

            if (sessionId) {
                const ttlSeconds = 7 * 24 * 60 * 60
                const rotateRes = await this.sessionsService.rotate(
                    sessionId,
                    refreshToken,
                    newRefreshToken,
                    ttlSeconds
                )
                // debug log removed
                // if rotation succeeded, update token store; otherwise reuse may have been detected
                if (rotateRes.rotated) {
                    await this.tokensService.revokeRefreshToken(
                        userId,
                        refreshToken
                    )
                    await this.tokensService.storeRefreshToken(
                        userId,
                        newRefreshToken
                    )
                } else {
                    // if rotate reported a previousHash equal to incoming, reuse detection already handled
                    // In any case, deny the refresh attempt
                    throw new UnauthorizedException(
                        'Invalid or reused refresh token'
                    )
                }
            } else {
                // no sessionId: fallback to token-store based rotation
                await this.tokensService.revokeRefreshToken(
                    userId,
                    refreshToken
                )
                await this.tokensService.storeRefreshToken(
                    userId,
                    newRefreshToken
                )
            }
            return { accessToken, refreshToken: newRefreshToken }
        } catch {
            throw new UnauthorizedException('Invalid refresh token')
        }
    }

    async logout(userId: string, refreshToken: string) {
        await this.tokensService.revokeRefreshToken(userId, refreshToken)
    }
}
