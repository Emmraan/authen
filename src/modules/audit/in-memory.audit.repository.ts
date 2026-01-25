import { AuditRepository, AuditEvent } from './audit.repository'
import { v4 as uuidv4 } from 'uuid'

export class InMemoryAuditRepository implements AuditRepository {
    private events: AuditEvent[] = []

    async save(evt: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
        const e: AuditEvent = {
            id: uuidv4(),
            createdAt: new Date(),
            ...evt,
        }
        this.events.push(e)
        return e
    }

    async listForUser(userId: string): Promise<AuditEvent[]> {
        return this.events.filter((e) => e.userId === userId)
    }
}
