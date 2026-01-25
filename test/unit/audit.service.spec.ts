import { InMemoryAuditRepository } from '../../src/modules/audit/in-memory.audit.repository'
import { AuditService } from '../../src/modules/audit/audit.service'

describe('AuditService', () => {
    it('saves and lists events for a user', async () => {
        const repo = new InMemoryAuditRepository()
        const svc = new AuditService(repo as any)

        const e1 = await svc.log('user_changed_password', 'user-1', {
            ip: '1.2.3.4',
        })
        expect(e1.id).toBeDefined()

        const list = await svc.listForUser('user-1')
        expect(list.length).toBe(1)
        expect(list[0].type).toBe('user_changed_password')
    })
})
