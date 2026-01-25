import { SessionsController } from '../../src/modules/sessions/sessions.controller'

const makeSvc = () => ({
    listForUser: jest.fn(async () => [
        {
            id: 's1',
            deviceInfo: { d: 1 },
            ipAddress: '1.2.3.4',
            expiresAt: new Date(),
            revokedAt: null,
            lastUsedAt: null,
        },
    ]),
    revokeAll: jest.fn(async () => 1),
})

describe('SessionsController', () => {
    let svc: ReturnType<typeof makeSvc>
    let ctrl: SessionsController

    beforeEach(() => {
        svc = makeSvc()
        ctrl = new SessionsController(svc as any)
    })

    it('list returns session DTOs', async () => {
        const req: any = { user: { userId: 'user-1' } }
        const res = await ctrl.list(req)
        expect(Array.isArray(res)).toBe(true)
        expect(res[0]).toHaveProperty('id')
    })

    it('logoutAll revokes sessions', async () => {
        const req: any = { user: { userId: 'user-1' } }
        const out = await ctrl.logoutAll(req)
        expect(svc.revokeAll).toHaveBeenCalledWith(
            'user-1',
            'user_requested_logout_all'
        )
        expect(out).toHaveProperty('message')
    })
})
