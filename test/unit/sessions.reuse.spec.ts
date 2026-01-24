import { SessionsService } from '../../src/modules/sessions/sessions.service'
import { InMemorySessionsRepository } from '../../src/modules/sessions/in-memory.sessions.repository'
import { ConfigService } from '../../src/config/config.service'

class DummyAudit {
    public events: any[] = []
    async log(type: string, userId: string, meta?: any) {
        this.events.push({ type, userId, meta })
    }
}

describe('Sessions reuse detection unit', () => {
    it('revokes all sessions when previous token is reused', async () => {
        const repo = new InMemorySessionsRepository()
        const config = new ConfigService()
        const audit = new DummyAudit() as any
        const svc = new SessionsService(
            repo as any,
            config as any,
            audit as any
        )

        // create initial session with token 'old'
        const userId = 'user-1'
        const old = 'old-token-value'
        const ttl = 3600
        const sess = await svc.createSession(
            userId,
            old,
            { device: 'x' },
            '127.0.0.1',
            ttl
        )

        // simulate legitimate rotation: old -> new1
        const new1 = 'new-token-1'
        const r1 = await svc.rotate(sess.sessionId, old, new1, ttl)
        expect(r1.rotated).toBeTruthy()

        // simulate attacker reusing the *previous* token (old) against same session
        const attempt = await svc.rotate(
            sess.sessionId,
            old,
            'new-token-2',
            ttl
        )
        // since old was previousHash, this should trigger revokeAll and not rotate
        // rotation returns { rotated: false }
        expect(attempt.rotated).toBe(false)

        // audit should have a token_reuse_detected entry
        expect(
            audit.events.some((e: any) => e.type === 'token_reuse_detected')
        ).toBeTruthy()
    })
})
