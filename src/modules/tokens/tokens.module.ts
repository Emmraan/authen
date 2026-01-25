import { Module } from '@nestjs/common'
import { TokensService } from './tokens.service'
import { InMemoryTokensRepository } from './in-memory.tokens.repository'
import { VerificationService } from './verification.service'

@Module({
    providers: [TokensService, InMemoryTokensRepository, VerificationService],
    exports: [TokensService, InMemoryTokensRepository, VerificationService],
})
export class TokensModule {}
