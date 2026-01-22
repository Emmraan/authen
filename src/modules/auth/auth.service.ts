import { Injectable, UnauthorizedException } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { TokensService } from '../tokens/tokens.service'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '../../config/config.service'
import { comparePasswords } from '../../utils/hash.util'

@Injectable()
export class AuthService {
    private accessSecret: string
    private refreshSecret: string
    private accessExpiresIn: string
    private refreshExpiresIn: string

    constructor(
        private usersService: UsersService,
        private tokensService: TokensService,
        private jwtService: JwtService,
        private config: ConfigService
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
        const isValid = await comparePasswords(password, (user as any).password)
        if (!isValid) return null
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
            { secret: this.refreshSecret, expiresIn: this.refreshExpiresIn }
        )
        await this.tokensService.storeRefreshToken(user.id, refreshToken)
        return { accessToken, refreshToken }
    }

    async refresh(userId: string, refreshToken: string) {
        // verify token signature + existence
        try {
            const decoded: any = this.jwtService.verify(refreshToken, {
                secret: this.refreshSecret,
            })
            if (decoded.userId !== userId)
                throw new UnauthorizedException('Invalid token payload')
            await this.tokensService.validateRefreshToken(userId, refreshToken)
            const user = await this.usersService.findById(userId)
            const payload = this.buildAccessTokenPayload(user)
            const accessToken = this.jwtService.sign(payload, {
                secret: this.accessSecret,
                expiresIn: this.accessExpiresIn,
            })
            return { accessToken }
        } catch {
            throw new UnauthorizedException('Invalid refresh token')
        }
    }

    async logout(userId: string, refreshToken: string) {
        await this.tokensService.revokeRefreshToken(userId, refreshToken)
    }
}
