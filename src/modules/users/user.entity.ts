export type UserRole = 'user' | 'admin'

export class User {
    id!: string
    email!: string
    password!: string // hashed
    role!: UserRole
    isActive!: boolean
    createdAt!: Date
    emailVerified?: boolean
    failedLoginAttempts?: number
    lockedUntil?: Date | null
    lastLoginAt?: Date | null
    name?: string
}
