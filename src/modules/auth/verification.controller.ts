import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common'
import { VerificationService } from '../tokens/verification.service'
import { UsersService } from '../users/users.service'
import { MailService } from '../../utils/mail.service'

class VerifyEmailDto {
    token!: string
}
class ResendVerificationDto {
    email!: string
}
class ForgotPasswordDto {
    email!: string
}
class ResetPasswordDto {
    token!: string
    newPassword!: string
}

@Controller('auth')
export class VerificationController {
    constructor(
        private verification: VerificationService,
        private usersService: UsersService,
        private mail: MailService
    ) {}

    @HttpCode(HttpStatus.OK)
    @Post('verify-email')
    async verifyEmail(@Body() body: VerifyEmailDto) {
        const { token } = body
        const rec = await this.verification.verifyToken(token, 'email_verify')
        // mark user's emailVerified in users service
        await this.usersService.markEmailVerified(rec.userId)
        return { message: 'Email verified' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('resend-verification')
    async resendVerification(@Body() body: ResendVerificationDto) {
        const { email } = body
        const user = await this.usersService.findByEmail(email)
        // Ambiguous response to prevent enumeration
        if (!user) return { message: 'If user exists, verification sent' }
        if (user.emailVerified)
            return { message: 'If user exists, verification sent' }

        const { rawToken, expiresAt } =
            await this.verification.createVerificationToken(
                user.id,
                'email_verify',
                24 * 3600
            )
        await this.mail.sendVerificationEmail(user.email, rawToken, {
            expiresAt,
            name: user.name,
        })
        return { message: 'If user exists, verification sent' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('forgot-password')
    async forgotPassword(@Body() body: ForgotPasswordDto) {
        const { email } = body
        const user = await this.usersService.findByEmail(email)
        if (!user) return { message: 'If user exists, reset link sent' }

        const { rawToken, expiresAt } =
            await this.verification.createVerificationToken(
                user.id,
                'password_reset',
                3600
            )
        await this.mail.sendPasswordResetEmail(user.email, rawToken, {
            expiresAt,
            name: user.name,
        })
        return { message: 'If user exists, reset link sent' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('reset-password')
    async resetPassword(@Body() body: ResetPasswordDto) {
        const { token, newPassword } = body
        const rec = await this.verification.verifyToken(token, 'password_reset')
        // update user's password and revoke all sessions
        await this.usersService.updatePassword(rec.userId, newPassword)
        await this.usersService.revokeAllSessions(rec.userId)
        return { message: 'Password changed' }
    }
}
