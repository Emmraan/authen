import { InMemoryUsersRepository } from '../../src/modules/users/in-memory.users.repository'

describe('InMemoryUsersRepository', () => {
    it('creates and finds users', async () => {
        const repo = new InMemoryUsersRepository()
        const u = await repo.create({ email: 'a@b.com', password: 'p' } as any)
        expect(u).toHaveProperty('id')
        const found = await repo.findByEmail('a@b.com')
        expect(found).not.toBeNull()
    })
})
