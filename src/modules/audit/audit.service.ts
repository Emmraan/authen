import { Injectable, Inject } from '@nestjs/common'
import { AuditRepository } from './audit.repository'

@Injectable()
export class AuditService {
    constructor(@Inject('AUDIT_REPOSITORY') private repo: AuditRepository) {}

    async log(type: string, userId?: string, meta?: Record<string, any>) {
        return await this.repo.save({ type, userId, meta })
    }

    async listForUser(userId: string) {
        return await this.repo.listForUser(userId)
    }
}
