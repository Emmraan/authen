// Minimal MailService skeleton. Replace with real provider (SES, SendGrid) in production.
import { Injectable, Inject, Optional } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { REDIS_CLIENT } from '../providers/redis.provider'
import { selectMailProvider } from './mail.provider'

@Injectable()
export class MailService {
    constructor(
        private config: ConfigService,
        @Inject(REDIS_CLIENT) @Optional() private redisClient?: any
    ) {}

    private frontendUrl() {
        return this.config.get('FRONTEND_URL', 'https://app.example.com')
    }

    private async enqueue(payload: any) {
        if (this.redisClient && typeof this.redisClient.lpush === 'function') {
            // push into a simple Redis list for a separate worker to consume
            await this.redisClient.lpush(
                this.config.get('MAIL_QUEUE_KEY', 'mail:queue'),
                JSON.stringify(payload)
            )
            return
        }

        // If no redis, try to send directly using selected provider (smtp or console)
        const provider = selectMailProvider(this.config)
        try {
            await provider.send(payload)
            return
        } catch (err) {
            console.warn('Mail send failed, falling back to console', err)
        }

        // final fallback to console for local/dev
        console.log('SEND EMAIL', payload)
    }

    async sendVerificationEmail(
        to: string,
        token: string,
        opts: { expiresAt: Date; name?: string }
    ) {
        const link = `${this.frontendUrl()}/verify-email?token=${encodeURIComponent(token)}`
        await this.enqueue({
            to,
            subject: 'Verify your email',
            link,
            expiresAt: opts.expiresAt,
            name: opts.name,
        })
    }

    async sendPasswordResetEmail(
        to: string,
        token: string,
        opts: { expiresAt: Date; name?: string }
    ) {
        const link = `${this.frontendUrl()}/reset-password?token=${encodeURIComponent(token)}`
        await this.enqueue({
            to,
            subject: 'Reset your password',
            link,
            expiresAt: opts.expiresAt,
            name: opts.name,
        })
    }
}
