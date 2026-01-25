import { SetMetadata } from '@nestjs/common'
import { PERMISSIONS_KEY } from './roles.constants'

export const Permissions = (...perms: string[]) =>
    SetMetadata(PERMISSIONS_KEY, perms)
