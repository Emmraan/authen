import { JwtAuthGuard } from '../../src/middleware/jwt-auth.guard'

describe('JwtAuthGuard (unit)', () => {
    it('is defined', () => {
        expect(JwtAuthGuard).toBeDefined()
    })
})
