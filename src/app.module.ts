import { Module } from '@nestjs/common'
import { ConfigModule } from './config/config.module'
import { UsersModule } from './modules/users/users.module'
import { AuthModule } from './modules/auth/auth.module'
import { TokensModule } from './modules/tokens/tokens.module'
import { RedisProvider } from './providers/redis.provider'
import { HealthController } from './modules/health/health.controller'

@Module({
    imports: [ConfigModule, UsersModule, TokensModule, AuthModule],
    controllers: [HealthController],
    providers: [RedisProvider],
})
export class AppModule {}
