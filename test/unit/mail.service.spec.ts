import { MailService } from '../../src/utils/mail.service'

class DummyConfig {
    private map: Record<string, string> = {}
    constructor(init: Record<string, string> = {}) {
        this.map = init
    }
    get(key: string, fallback?: string) {
        return this.map[key] ?? fallback
    }
}

describe('MailService', () => {
    it('enqueues verification email to redis when redis client present', async () => {
        const lpush = jest.fn().mockResolvedValue(1)
        const redisClient = { lpush }
        const cfg = new DummyConfig({ MAIL_QUEUE_KEY: 'mail:queue' })
        const svc = new MailService(cfg as any, redisClient as any)

        await svc.sendVerificationEmail('test@example.com', 'tok', {
            expiresAt: new Date(),
            name: 'Test',
        })

        expect(lpush).toHaveBeenCalled()
        const args = lpush.mock.calls[0]
        expect(args[0]).toBe('mail:queue')
        expect(typeof args[1]).toBe('string')
        const payload = JSON.parse(args[1])
        expect(payload.to).toBe('test@example.com')
        expect(payload.subject).toMatch(/Verify/i)
    })

    it('falls back to console when redis missing', async () => {
        const cfg = new DummyConfig()
        const svc = new MailService(cfg as any, undefined)
        const spy = jest.spyOn(console, 'log').mockImplementation(() => {})
        await svc.sendPasswordResetEmail('a@b.com', 'tok2', {
            expiresAt: new Date(),
        })
        expect(spy).toHaveBeenCalled()
        spy.mockRestore()
    })
})
