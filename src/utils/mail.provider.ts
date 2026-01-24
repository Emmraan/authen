import { ConfigService } from '../config/config.service'

// exported so tests can override the loader (avoids requiring nodemailer in CI)
/* eslint-disable prefer-const */
export let _loadNodemailer: () => Promise<any> = async () =>
    await import('nodemailer')

export interface MailProvider {
    send(payload: any): Promise<void>
}

export class ConsoleMailProvider implements MailProvider {
    async send(payload: any) {
        console.log('ConsoleMailProvider send', payload)
    }
}

export class SmtpMailProvider implements MailProvider {
    private transporter: any
    private from: string
    private config: ConfigService

    constructor(config: ConfigService) {
        this.config = config
        const host = this.config.get('SMTP_HOST')
        this.from = this.config.get('SMTP_FROM') || `no-reply@${host}`
    }

    async send(payload: any) {
        if (!this.transporter) {
            const mod = await _loadNodemailer().catch(() => null)
            if (!mod) throw new Error('nodemailer not installed')
            const nodemailer = (mod as any).default || mod
            const host = this.config.get('SMTP_HOST')
            const port = parseInt(this.config.get('SMTP_PORT') || '587', 10)
            const user = this.config.get('SMTP_USER')
            const pass = this.config.get('SMTP_PASS')
            this.transporter = nodemailer.createTransport({
                host,
                port,
                secure: false,
                auth: user ? { user, pass } : undefined,
            })
        }

        const info = await this.transporter.sendMail({
            from: this.from,
            to: payload.to,
            subject: payload.subject,
            text: payload.text || payload.link || '',
            html: payload.html || undefined,
        })
        console.log('SmtpMailProvider sent', info && info.messageId)
    }
}

export function selectMailProvider(config: ConfigService): MailProvider {
    const provider =
        config.get('MAIL_PROVIDER') || process.env.MAIL_PROVIDER || ''
    const direct = config.get('MAIL_DIRECT') || process.env.MAIL_DIRECT
    const directFlag = String(direct) === 'true' || String(direct) === '1'
    if (provider === 'smtp' || directFlag) {
        try {
            return new SmtpMailProvider(config)
        } catch {
            return new ConsoleMailProvider()
        }
    }
    return new ConsoleMailProvider()
}
