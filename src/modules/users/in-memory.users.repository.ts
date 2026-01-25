import { Injectable } from '@nestjs/common'
import { User } from './user.entity'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class InMemoryUsersRepository {
    private users = new Map<string, User>()

    async create(userPartial: Partial<User>): Promise<User> {
        const user: User = {
            id: uuidv4(),
            email: userPartial.email!,
            password: userPartial.password!,
            role: userPartial.role ?? 'user',
            isActive: userPartial.isActive ?? true,
            createdAt: new Date(),
            emailVerified: userPartial.emailVerified ?? false,
            failedLoginAttempts: userPartial.failedLoginAttempts ?? 0,
            lockedUntil: userPartial.lockedUntil ?? null,
            lastLoginAt: userPartial.lastLoginAt ?? null,
        }
        this.users.set(user.id, user)
        return this.filterSensitive(user)
    }

    async findByEmail(email: string): Promise<User | null> {
        for (const u of this.users.values()) {
            if (u.email.toLowerCase() === email.toLowerCase())
                return this.filterSensitive(u)
        }
        return null
    }

    async findById(id: string): Promise<User | null> {
        const u = this.users.get(id)
        return u ? this.filterSensitive(u) : null
    }

    async save(user: User): Promise<User> {
        this.users.set(user.id, user)
        return this.filterSensitive(user)
    }

    private filterSensitive(user: User): User {
        const copy = { ...user }
        // keep hashed password but avoid leaking raw secrets in API layers
        return copy
    }
}
