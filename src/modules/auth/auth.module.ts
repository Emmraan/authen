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
import { AdminController } from '../admin/admin.controller'
import { AdminService } from '../admin/admin.service'
import { ConfigModule } from '../../config/config.module'
import { ConfigService } from '../../config/config.service'
import { RedisProvider } from '../../providers/redis.provider'
import { MailService } from '../../utils/mail.service'
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
    controllers: [AuthController, SessionsController, AdminController],
    providers: [
        AuthService,
        JwtAuthGuard,
        SessionsService,
        RedisProvider,
        MailService,
        AdminService,
        {
            provide: 'SESSIONS_REPOSITORY',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                let pool: any = null
                try {
                    // keep `pg` optional for local/dev environments
                    /* eslint-disable @typescript-eslint/no-require-imports */
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { Pool } = require('pg')
                    /* eslint-enable @typescript-eslint/no-require-imports */
                    pool = new Pool({
                        connectionString: config.get('DATABASE_URL'),
                    })
                } catch {
                    // `pg` not installed or failed to initialize — fallback to null
                }
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
