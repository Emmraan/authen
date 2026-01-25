import { SessionsService } from '../../src/modules/sessions/sessions.service'
import { SessionsRepository } from '../../src/modules/sessions/sessions.repository'

const makeRepo = () => {
    const repo: Partial<SessionsRepository> = {
        create: jest.fn(async (s) => ({
            ...s,
            createdAt: new Date(),
            lastUsedAt: null,
            revokedAt: null,
        })),
        rotateRefreshToken: jest.fn(),
        revokeAllForUser: jest.fn(async () => 1),
        revokeSession: jest.fn(async () => {}),
        listSessionsForUser: jest.fn(async () => []),
        findById: jest.fn(async () => null),
    }
    return repo as SessionsRepository & Record<string, any>
}

describe('SessionsService', () => {
    let repo: SessionsRepository & Record<string, any>
    let svc: SessionsService
    const mockConfig: any = {
        get: jest.fn((k: string, d?: any) => {
            if (k === 'HMAC_SECRET') return 'testhmac'
            return d
        }),
    }

    beforeEach(() => {
        repo = makeRepo()
        const mockAudit = { log: jest.fn().mockResolvedValue(undefined) }
        svc = new SessionsService(repo, mockConfig as any, mockAudit as any)
    })

    it('createSession stores session and returns metadata', async () => {
        const res = await svc.createSession(
            'user-1',
            'rawtoken',
            { device: 'x' },
            '127.0.0.1',
            3600
        )
        expect(res).toHaveProperty('sessionId')
        expect(res).toHaveProperty('expiresAt')
        expect(repo.create).toHaveBeenCalled()
    })

    it('rotate returns rotated true when repo succeeds', async () => {
        repo.rotateRefreshToken = jest.fn(async () => ({
            success: true,
            userId: 'user-1',
        }))
        const out = await svc.rotate('sess-1', 'incomingRaw', 'newRaw', 3600)
        expect(out.rotated).toBe(true)
        expect(out.userId).toBe('user-1')
    })

    it('rotate handles reuse detection and revokes all sessions', async () => {
        // simulate repo returning previousHash equal to incoming hash
        const incomingRaw = 'incomingRaw'
        const hmac = 'testhmac'
        // compute hash using same util as service
        const { hashToken } = await import('../../src/utils/token.util')
        const incomingHash = hashToken(incomingRaw, hmac)

        repo.rotateRefreshToken = jest.fn(async () => ({
            success: false,
            userId: 'user-1',
            previousHash: incomingHash,
        }))
        repo.revokeAllForUser = jest.fn(async () => 2)

        const out = await svc.rotate('sess-1', incomingRaw, 'newRaw', 3600)
        expect(out.rotated).toBe(false)
        expect(repo.revokeAllForUser).toHaveBeenCalledWith(
            'user-1',
            'token_reuse_detected'
        )
    })

    it('revoke delegates to repo', async () => {
        await svc.revoke('sess-1', 'reason')
        expect(repo.revokeSession).toHaveBeenCalledWith('sess-1', 'reason')
    })

    it('revokeAll delegates to repo', async () => {
        await svc.revokeAll('user-1', 'reason')
        expect(repo.revokeAllForUser).toHaveBeenCalledWith('user-1', 'reason')
    })

    it('listForUser delegates to repo', async () => {
        await svc.listForUser('user-1')
        expect(repo.listSessionsForUser).toHaveBeenCalledWith('user-1')
    })
})
