import { Injectable } from '@nestjs/common'

@Injectable()
export class InMemoryTokensRepository {
    // Map<userId, Set<refreshToken>>
    private store = new Map<string, Set<string>>()

    async add(userId: string, token: string) {
        const set = this.store.get(userId) ?? new Set<string>()
        set.add(token)
        this.store.set(userId, set)
    }

    async remove(userId: string, token: string) {
        const set = this.store.get(userId)
        if (!set) return
        set.delete(token)
        if (set.size === 0) this.store.delete(userId)
    }

    async exists(userId: string, token: string): Promise<boolean> {
        const set = this.store.get(userId)
        return !!set && set.has(token)
    }

    async removeAllForUser(userId: string) {
        this.store.delete(userId)
    }
}
