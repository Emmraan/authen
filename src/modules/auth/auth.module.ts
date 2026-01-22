import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { AuthController } from './auth.controller'
import { UsersModule } from '../users/users.module'
import { TokensModule } from '../tokens/tokens.module'
import { ConfigModule } from '../../config/config.module'
import { ConfigService } from '../../config/config.service'
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard'

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
    controllers: [AuthController],
    providers: [AuthService, JwtAuthGuard],
    exports: [AuthService],
})
export class AuthModule {}
