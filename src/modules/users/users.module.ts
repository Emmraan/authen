import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { InMemoryUsersRepository } from './in-memory.users.repository'

@Module({
    providers: [UsersService, InMemoryUsersRepository],
    exports: [UsersService, InMemoryUsersRepository],
})
export class UsersModule {}
