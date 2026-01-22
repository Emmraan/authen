import {
    Injectable,
    ConflictException,
    NotFoundException,
} from '@nestjs/common'
import { InMemoryUsersRepository } from './in-memory.users.repository'
import { CreateUserDto } from './dto/create-user.dto'
import { hashPassword } from '../../utils/hash.util'
import { ConfigService } from '../../config/config.service'

@Injectable()
export class UsersService {
    constructor(
        private usersRepo: InMemoryUsersRepository,
        private config: ConfigService
    ) {}

    async create(dto: CreateUserDto) {
        const existing = await this.usersRepo.findByEmail(dto.email)
        if (existing) throw new ConflictException('Email already in use')
        const configured = this.config.getNumber('BCRYPT_SALT_ROUNDS', 12)
        const saltRounds = configured >= 10 ? configured : 12
        const hashed = await hashPassword(dto.password, saltRounds)
        const user = await this.usersRepo.create({
            email: dto.email,
            password: hashed,
        })
        // remove password field before returning to API layer (construct explicitly)
        const rest = {
            id: user.id,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
        }
        return rest
    }

    async findByEmail(email: string) {
        return this.usersRepo.findByEmail(email)
    }

    async findById(id: string) {
        const u = await this.usersRepo.findById(id)
        if (!u) throw new NotFoundException('User not found')
        return u
    }
}
