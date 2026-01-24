import {
    Module,
    NestModule,
    MiddlewareConsumer,
    RequestMethod,
} from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { TokensModule } from '../tokens/tokens.module'
import { ConfigModule } from '../../config/config.module'
import { ConfigService } from '../../config/config.service'
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard'
import { RateLimitMiddleware } from '../../middleware/rate-limit.middleware'
import { SessionsController } from '../sessions/sessions.controller'
import { SessionsService } from '../sessions/sessions.service'
import { PostgresSessionsRepository } from '../sessions/postgres.sessions.repository'

@Module({
    imports: [
        ConfigModule,
        UsersModule,
        TokensModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get(
                    'JWT_ACCESS_TOKEN_SECRET',
                    'change_me_access'
                ),
                signOptions: {
                    expiresIn: config.get('JWT_ACCESS_TOKEN_EXPIRES_IN', '15m'),
                },
            }),
        }),
    ],
    controllers: [AuthController, SessionsController],
    providers: [
        AuthService,
        JwtAuthGuard,
        SessionsService,
        {
            provide: 'SESSIONS_REPOSITORY',
            useFactory: () => {
                // NOTE: In production, replace with injected DB pool provider
                const pool: any = null
                return new PostgresSessionsRepository(pool)
            },
        },
    ],
    exports: [AuthService, SessionsService],
})
export class AuthModule implements NestModule {
    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(RateLimitMiddleware)
            .forRoutes(
                { path: 'auth/login', method: RequestMethod.POST },
                { path: 'auth/forgot-password', method: RequestMethod.POST }
            )
    }
}
