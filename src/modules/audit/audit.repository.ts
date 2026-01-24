export interface AuditEvent {
    id: string
    type: string
    userId?: string
    meta?: Record<string, any>
    createdAt: Date
}

export interface AuditRepository {
    save(evt: Omit<AuditEvent, 'id' | 'createdAt'>): Promise<AuditEvent>
    listForUser(userId: string): Promise<AuditEvent[]>
}
