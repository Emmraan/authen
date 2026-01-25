import { UsersService } from '../../src/modules/users/users.service'
import { InMemoryUsersRepository } from '../../src/modules/users/in-memory.users.repository'
import { ConfigService } from '../../src/config/config.service'
jest.mock('../../src/utils/hash.util', () => ({
    hashPassword: jest.fn().mockResolvedValue('h'),
}))
import { hashPassword } from '../../src/utils/hash.util'

class StubConfig extends ConfigService {}

describe('UsersService (unit)', () => {
    let usersService: UsersService

    beforeEach(() => {
        const repo = new InMemoryUsersRepository()
        const cfg = new StubConfig()
        const mockAudit: any = { log: jest.fn().mockResolvedValue(undefined) }
        usersService = new UsersService(repo, cfg as any, mockAudit)
    })

    it('creates a user and hides password in response', async () => {
        const dto = {
            email: 'test@example.com',
            password: 'password123',
        } as any
        const created = await usersService.create(dto)
        expect(created).toHaveProperty('id')
        expect(created).toHaveProperty('email', 'test@example.com')
        // password should not be present
        // @ts-expect-error hide password property from response
        expect(created.password).toBeUndefined()
    })

    it('finds user by email', async () => {
        const dto = {
            email: 'findme@example.com',
            password: 'password123',
        } as any
        await usersService.create(dto)
        const found = await usersService.findByEmail('findme@example.com')
        expect(found).not.toBeNull()
        expect(found!.email).toEqual('findme@example.com')
    })

    it('create throws on duplicate email', async () => {
        const dto = { email: 'dup@example.com', password: 'password' } as any
        await usersService.create(dto)
        await expect(usersService.create(dto)).rejects.toThrow()
    })

    it('findById throws when not found (explicit)', async () => {
        await expect(usersService.findById('no-such-id')).rejects.toThrow()
    })

    it('findById returns user when present', async () => {
        const dto = { email: 'present@example.com', password: 'pass' } as any
        const created = await usersService.create(dto)
        const found = await usersService.findById(created.id)
        expect(found).not.toBeNull()
        expect(found!.id).toBe(created.id)
    })

    it('create uses configured salt rounds >=10 when provided', async () => {
        const repo = new InMemoryUsersRepository()
        const cfg: any = { getNumber: () => 15 }
        const mockAudit: any = { log: jest.fn().mockResolvedValue(undefined) }
        const svc = new UsersService(repo, cfg as any, mockAudit)
        const dto = { email: 'salt@example.com', password: 'pwd' } as any
        await svc.create(dto)
        const calls = (hashPassword as jest.Mock).mock.calls
        expect(calls.length).toBeGreaterThan(0)
        const last = calls[calls.length - 1]
        expect(last[1]).toBe(15)
    })
})
