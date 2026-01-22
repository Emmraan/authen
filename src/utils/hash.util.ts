import * as bcrypt from 'bcryptjs'

const DEFAULT_SALT = 12
const MIN_SALT = 10

export async function hashPassword(password: string, saltRounds?: number) {
    let rounds = saltRounds ?? DEFAULT_SALT
    if (rounds < MIN_SALT) rounds = MIN_SALT
    return bcrypt.hash(password, rounds)
}

export async function comparePasswords(password: string, hash: string) {
    return bcrypt.compare(password, hash)
}
