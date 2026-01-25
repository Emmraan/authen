import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY } from './roles.constants'
import { RolesService } from '../modules/roles/roles.service'

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private rolesService: RolesService
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const required =
            this.reflector.get<string[]>(ROLES_KEY, context.getHandler()) || []
        if (!required.length) return true

        const req = context.switchToHttp().getRequest()
        const user = req.user
        if (!user) return false

        return this.rolesService.hasAnyRole(user.id, required)
    }
}
