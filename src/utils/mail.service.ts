// Minimal MailService skeleton. Replace with real provider (SES, SendGrid) in production.
import { Injectable } from '@nestjs/common'

@Injectable()
export class MailService {
    async sendVerificationEmail(
        to: string,
        token: string,
        opts: { expiresAt: Date; name?: string }
    ) {
        const link = `${process.env.FRONTEND_URL || 'https://app.example.com'}/verify-email?token=${encodeURIComponent(token)}`
        // enqueue email send in real app; here just a placeholder
        console.log('SEND EMAIL', {
            to,
            subject: 'Verify your email',
            link,
            expiresAt: opts.expiresAt,
        })
    }

    async sendPasswordResetEmail(
        to: string,
        token: string,
        opts: { expiresAt: Date; name?: string }
    ) {
        const link = `${process.env.FRONTEND_URL || 'https://app.example.com'}/reset-password?token=${encodeURIComponent(token)}`
        console.log('SEND EMAIL', {
            to,
            subject: 'Reset your password',
            link,
            expiresAt: opts.expiresAt,
        })
    }
}
