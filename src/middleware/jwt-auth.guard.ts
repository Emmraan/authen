import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '../config/config.service'

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private jwtService: JwtService,
        private config: ConfigService
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const req = context.switchToHttp().getRequest()
        const authHeader =
            req.headers['authorization'] || req.headers['Authorization']
        if (!authHeader)
            throw new UnauthorizedException('Missing authorization header')
        const parts = authHeader.split(' ')
        if (parts.length !== 2 || parts[0] !== 'Bearer')
            throw new UnauthorizedException('Invalid authorization header')
        const token = parts[1]
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.config.get(
                    'JWT_ACCESS_TOKEN_SECRET',
                    'change_me_access'
                ),
            })
            req.user = payload
            return true
        } catch {
            throw new UnauthorizedException('Invalid or expired token')
        }
    }
}
