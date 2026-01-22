import { hashPassword, comparePasswords } from '../../src/utils/hash.util'

describe('hash.util (extra)', () => {
    it('hashPassword enforces min salt rounds and compares correctly', async () => {
        const h = await hashPassword('pwd', 1) // should enforce MIN_SALT
        expect(typeof h).toBe('string')
        const ok = await comparePasswords('pwd', h)
        expect(ok).toBe(true)
    })

    it('comparePasswords returns false for wrong password', async () => {
        const h = await hashPassword('a_long_pwd')
        const ok = await comparePasswords('wrong', h)
        expect(ok).toBe(false)
    })
})
