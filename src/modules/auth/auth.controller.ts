import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    Req,
    UseGuards,
    Get,
} from '@nestjs/common'
import { AuthService } from './auth.service'
import { SignupDto } from './dto/signup.dto'
import { LoginDto } from './dto/login.dto'
import { JwtAuthGuard } from '../../middleware'

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    async signup(@Body() dto: SignupDto) {
        const user = await this.authService.signup(dto.email, dto.password)
        // DO NOT return sensitive fields
        return {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
        }
    }

    @HttpCode(HttpStatus.OK)
    @Post('login')
    async login(@Body() dto: LoginDto) {
        const validated = await this.authService.validateUser(
            dto.email,
            dto.password
        )
        if (!validated)
            return { statusCode: 401, message: 'Invalid credentials' }
        const tokens = await this.authService.login(validated)
        return tokens
    }

    @HttpCode(HttpStatus.OK)
    @Post('refresh')
    async refresh(
        @Body()
        body: {
            userId: string
            refreshToken: string
            sessionId?: string
        }
    ) {
        const { userId, refreshToken, sessionId } = body
        // debug log removed
        // no pre-parse here; AuthService performs necessary checks
        const result = await this.authService.refresh(
            userId,
            refreshToken,
            sessionId
        )
        return result
    }

    @HttpCode(HttpStatus.OK)
    @Post('logout')
    async logout(@Body() body: { userId: string; refreshToken: string }) {
        await this.authService.logout(body.userId, body.refreshToken)
        return { success: true }
    }

    @UseGuards(JwtAuthGuard)
    @Get('me')
    async me(@Req() req: any) {
        // JwtAuthGuard attaches user to request
        const user = req.user
        return { id: user.userId, email: user.email, role: user.role }
    }
}
