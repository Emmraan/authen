import {
    Controller,
    Get,
    Post,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import { SessionsService } from './sessions.service'
import { JwtAuthGuard } from '../../middleware/jwt-auth.guard'

@Controller('auth')
export class SessionsController {
    constructor(private sessions: SessionsService) {}

    @UseGuards(JwtAuthGuard)
    @Get('sessions')
    async list(@Req() req: any) {
        const userId = req.user.userId
        const rows = await this.sessions.listForUser(userId)
        return rows.map((r) => ({
            id: r.id,
            deviceInfo: r.deviceInfo,
            ipAddress: r.ipAddress,
            expiresAt: r.expiresAt,
            revokedAt: r.revokedAt,
            lastUsedAt: r.lastUsedAt,
        }))
    }

    @UseGuards(JwtAuthGuard)
    @HttpCode(HttpStatus.OK)
    @Post('logout-all')
    async logoutAll(@Req() req: any) {
        const userId = req.user.userId
        await this.sessions.revokeAll(userId, 'user_requested_logout_all')
        return { message: 'All sessions revoked' }
    }
}
