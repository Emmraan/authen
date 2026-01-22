import { Module } from '@nestjs/common'
import { TokensService } from './tokens.service'
import { InMemoryTokensRepository } from './in-memory.tokens.repository'

@Module({
    providers: [TokensService, InMemoryTokensRepository],
    exports: [TokensService, InMemoryTokensRepository],
})
export class TokensModule {}
