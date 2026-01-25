import { AuditRepository, AuditEvent } from './audit.repository'

export class PostgresAuditRepository implements AuditRepository {
    constructor(private pool: any) {}

    async save(evt: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent> {
        const res = await this.pool.query(
            `INSERT INTO audit_events (type, user_id, meta) VALUES ($1,$2,$3) RETURNING id, type, user_id as "userId", meta, created_at as "createdAt"`,
            [evt.type, evt.userId || null, evt.meta || null]
        )
        return res.rows[0]
    }

    async listForUser(userId: string): Promise<AuditEvent[]> {
        const res = await this.pool.query(
            `SELECT id, type, user_id as "userId", meta, created_at as "createdAt" FROM audit_events WHERE user_id = $1 ORDER BY created_at DESC`,
            [userId]
        )
        return res.rows
    }
}
