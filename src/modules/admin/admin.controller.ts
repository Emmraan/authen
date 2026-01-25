import {
    Controller,
    Post,
    Param,
    Body,
    HttpCode,
    HttpStatus,
} from '@nestjs/common'
import { AdminService } from './admin.service'

class RoleDto {
    role!: string
}

@Controller('admin')
export class AdminController {
    constructor(private admin: AdminService) {}

    @HttpCode(HttpStatus.OK)
    @Post('users/:id/deactivate')
    async deactivate(@Param('id') id: string) {
        await this.admin.setActive(id, false)
        return { message: 'User deactivated' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('users/:id/activate')
    async activate(@Param('id') id: string) {
        await this.admin.setActive(id, true)
        return { message: 'User activated' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('users/:id/roles')
    async setRole(@Param('id') id: string, @Body() body: RoleDto) {
        await this.admin.setRole(id, body.role)
        return { message: 'Role updated' }
    }

    @HttpCode(HttpStatus.OK)
    @Post('users/:id/force-logout')
    async forceLogout(@Param('id') id: string) {
        await this.admin.forceLogout(id)
        return { message: 'User logged out from all sessions' }
    }
}
