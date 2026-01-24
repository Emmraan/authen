import { Injectable } from '@nestjs/common'
import { UsersService } from '../users/users.service'
import { SessionsService } from '../sessions/sessions.service'

@Injectable()
export class AdminService {
    constructor(
        private usersService: UsersService,
        private sessionsService: SessionsService
    ) {}

    async setActive(userId: string, active: boolean) {
        return await this.usersService.setActive(userId, active)
    }

    async setRole(userId: string, role: string) {
        return await this.usersService.setRole(userId, role)
    }

    async forceLogout(userId: string) {
        return await this.sessionsService.revokeAll(
            userId,
            'admin_force_logout'
        )
    }
}
