import { AuthService } from '../../src/modules/auth/auth.service'
import { UsersService } from '../../src/modules/users/users.service'

describe('AuthService (unit smoke)', () => {
    it('can be imported', () => {
        expect(AuthService).toBeDefined()
        expect(UsersService).toBeDefined()
    })
})
