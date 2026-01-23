import { AuthController } from '../../src/modules/auth/auth.controller'

describe('AuthController (unit)', () => {
    const makeSut = () => {
        const authService: any = {
            signup: jest.fn(),
            validateUser: jest.fn(),
            login: jest.fn(),
            refresh: jest.fn(),
            logout: jest.fn(),
        }
        const sut = new AuthController(authService)
        return { sut, authService }
    }

    it('signup returns public user fields', async () => {
        const { sut, authService } = makeSut()
        const user = {
            id: 'u1',
            email: 'a@b.com',
            role: 'r',
            isActive: true,
            createdAt: 't',
            password: 'secret',
        }
        authService.signup.mockResolvedValue(user)
        const res = await sut.signup({
            email: user.email,
            password: 'x',
        } as any)
        expect(res).toEqual({
            id: 'u1',
            email: 'a@b.com',
            role: 'r',
            isActive: true,
            createdAt: 't',
        })
    })

    it('login returns 401 object when not validated', async () => {
        const { sut, authService } = makeSut()
        authService.validateUser.mockResolvedValue(null)
        const res = await sut.login({ email: 'x', password: 'y' } as any)
        expect(res).toEqual({ statusCode: 401, message: 'Invalid credentials' })
    })

    it('login returns tokens when validated', async () => {
        const { sut, authService } = makeSut()
        const user = { id: 'u1', email: 'a@b.com' }
        authService.validateUser.mockResolvedValue(user)
        authService.login.mockResolvedValue({
            accessToken: 'a',
            refreshToken: 'r',
        })
        const res = await sut.login({ email: 'x', password: 'y' } as any)
        expect(res).toEqual({ accessToken: 'a', refreshToken: 'r' })
    })

    it('refresh and logout delegate to service', async () => {
        const { sut, authService } = makeSut()
        authService.refresh.mockResolvedValue({ accessToken: 'a' })
        const r = await sut.refresh({ userId: 'u1', refreshToken: 'r' } as any)
        expect(r).toEqual({ accessToken: 'a' })
        authService.logout.mockResolvedValue(undefined)
        const l = await sut.logout({ userId: 'u1', refreshToken: 'r' } as any)
        expect(l).toEqual({ success: true })
    })

    it('me returns user from request', async () => {
        const { sut } = makeSut()
        const res = await sut.me({
            user: { userId: 'u1', email: 'a@b', role: 'r' },
        } as any)
        expect(res).toEqual({ id: 'u1', email: 'a@b', role: 'r' })
    })
})
