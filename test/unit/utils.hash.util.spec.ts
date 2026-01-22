import { hashPassword, comparePasswords } from '../../src/utils/hash.util'

describe('hash util', () => {
    it('hash and compare', async () => {
        const h = await hashPassword('pwd', 10)
        const ok = await comparePasswords('pwd', h)
        expect(ok).toBe(true)
    })
})
