import { SignupDto } from '../../src/modules/auth/dto/signup.dto'
import { LoginDto } from '../../src/modules/auth/dto/login.dto'
import { CreateUserDto } from '../../src/modules/users/dto/create-user.dto'
import { User } from '../../src/modules/users/user.entity'
import * as authIndex from '../../src/modules/auth'
import * as usersIndex from '../../src/modules/users'

describe('Meta imports and DTO smoke', () => {
    it('can instantiate DTOs and entities', () => {
        const s = new SignupDto()
        s.email = 'a@b.com'
        s.password = 'password123'
        const l = new LoginDto()
        l.email = 'x@x.com'
        l.password = 'p'
        const c = new CreateUserDto()
        c.email = 'u@u.com'
        c.password = 'password123'
        const u = new User()
        u.id = 'id'
        u.email = 'e'
        u.password = 'h'
        u.role = 'user'
        expect(s).toBeDefined()
        expect(authIndex).toBeDefined()
        expect(usersIndex).toBeDefined()
        expect(c).toBeDefined()
        expect(u).toBeDefined()
    })
})
