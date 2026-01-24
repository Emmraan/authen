import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { InMemoryUsersRepository } from './in-memory.users.repository'
import { InMemoryAuditRepository } from '../audit/in-memory.audit.repository'
import { AuditService } from '../audit/audit.service'
import { PostgresAuditRepository } from '../audit/postgres.audit.repository'
import { ConfigService } from '../../config/config.service'

@Module({
    providers: [
        UsersService,
        InMemoryUsersRepository,
        {
            provide: 'AUDIT_REPOSITORY',
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                try {
                    /* eslint-disable @typescript-eslint/no-require-imports */
                    // eslint-disable-next-line @typescript-eslint/no-var-requires
                    const { Pool } = require('pg')
                    /* eslint-enable @typescript-eslint/no-require-imports */
                    const pool = new Pool({
                        connectionString: config.get('DATABASE_URL'),
                    })
                    return new PostgresAuditRepository(pool)
                } catch {
                    return new InMemoryAuditRepository()
                }
            },
        },
        AuditService,
    ],
    exports: [UsersService, InMemoryUsersRepository, AuditService],
})
export class UsersModule {}
