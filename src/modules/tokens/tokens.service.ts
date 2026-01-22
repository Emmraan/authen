import { Injectable, UnauthorizedException } from '@nestjs/common'
import { InMemoryTokensRepository } from './in-memory.tokens.repository'

@Injectable()
export class TokensService {
    constructor(private repo: InMemoryTokensRepository) {}

    async storeRefreshToken(userId: string, refreshToken: string) {
        await this.repo.add(userId, refreshToken)
    }

    async validateRefreshToken(userId: string, refreshToken: string) {
        const exists = await this.repo.exists(userId, refreshToken)
        if (!exists) throw new UnauthorizedException('Invalid refresh token')
        return true
    }

    async revokeRefreshToken(userId: string, refreshToken: string) {
        await this.repo.remove(userId, refreshToken)
    }

    async revokeAll(userId: string) {
        await this.repo.removeAllForUser(userId)
    }
}
