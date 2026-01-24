// Minimal RolesService skeleton — implement repository access and caching in real code
import { Injectable } from '@nestjs/common'

@Injectable()
export class RolesService {
    // Resolve user roles from repository / cache
    async getUserRoles(_userId: string): Promise<string[]> {
        void _userId
        // TODO: query UserRoles repository or users table
        return []
    }

    async hasAnyRole(userId: string, roles: string[]): Promise<boolean> {
        const userRoles = await this.getUserRoles(userId)
        return roles.some((r) => userRoles.includes(r))
    }

    // Permissions are derived from roles; implement resolution logic here
    async getUserPermissions(_userId: string): Promise<string[]> {
        void _userId
        // TODO: aggregate permissions for user roles
        return []
    }

    async hasAnyPermission(userId: string, perms: string[]): Promise<boolean> {
        const userPerms = await this.getUserPermissions(userId)
        return perms.some((p) => userPerms.includes(p))
    }
}
