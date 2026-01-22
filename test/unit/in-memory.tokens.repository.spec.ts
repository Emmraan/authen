import { InMemoryTokensRepository } from '../../src/modules/tokens/in-memory.tokens.repository'

describe('InMemoryTokensRepository', () => {
    it('stores and validates refresh tokens', async () => {
        const repo = new InMemoryTokensRepository()
        await repo.add('uid', 'rt')
        const ok = await repo.exists('uid', 'rt')
        expect(ok).toBe(true)
        await repo.remove('uid', 'rt')
        const ok2 = await repo.exists('uid', 'rt')
        expect(ok2).toBe(false)
    })
})
