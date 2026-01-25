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
import { RedisProvider, REDIS_CLIENT } from '../../providers/redis.provider'
import { MailService } from '../../utils/mail.service'
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard'
import { RateLimitMiddleware } from '../../middleware/rate-limit.middleware'
import { SessionsController } from '../sessions/sessions.controller'
import { SessionsService } from '../sessions/sessions.service'

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
            inject: [ConfigService, REDIS_CLIENT],
            useFactory: async (config: ConfigService, redisClient: any) => {
                if (redisClient) {
                    const mod =
                        await import('../sessions/redis.sessions.repository')
                    const RedisSessionsRepository = (mod as any)
                        .RedisSessionsRepository
                    return new RedisSessionsRepository(redisClient)
                }

                const dbUrl = config.get('DATABASE_URL')
                let pool: any = null
                if (dbUrl) {
                    try {
                        const pg = await import('pg')
                        const Pool = (pg as any).Pool
                        pool = new Pool({ connectionString: dbUrl })
                        // probe sessions table for expected columns
                        try {
                            const probe = await pool.query(
                                `SELECT column_name FROM information_schema.columns WHERE table_name='sessions' AND column_name='previous_refresh_token_hash' LIMIT 1`
                            )
                            if (
                                !probe ||
                                (probe.rows && probe.rows.length === 0)
                            ) {
                                // schema missing; fallback
                                await pool.end()
                                pool = null
                            }
                        } catch {
                            await pool.end()
                            pool = null
                        }
                    } catch {
                        pool = null
                    }
                }

                if (!pool) {
                    const mod =
                        await import('../sessions/in-memory.sessions.repository')
                    const InMemorySessionsRepository = (mod as any)
                        .InMemorySessionsRepository
                    return new InMemorySessionsRepository()
                }
                const mod =
                    await import('../sessions/postgres.sessions.repository')
                const PostgresSessionsRepository = (mod as any)
                    .PostgresSessionsRepository
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
