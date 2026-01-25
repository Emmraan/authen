import { AuthService } from '../../src/modules/auth/auth.service'
import * as bcrypt from 'bcryptjs'

describe('AuthService (unit)', () => {
    const makeSut = () => {
        const usersService: any = {
            create: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
        }
        const tokensService: any = {
            storeRefreshToken: jest.fn(),
            validateRefreshToken: jest.fn(),
            revokeRefreshToken: jest.fn(),
        }
        const jwtService: any = { sign: jest.fn(), verify: jest.fn() }
        const config: any = { get: jest.fn().mockReturnValue('secret') }
        const sessionsService: any = {
            createSession: jest.fn(),
            rotate: jest.fn(),
            findById: jest.fn(),
            revokeAll: jest.fn(),
        }
        const sut = new AuthService(
            usersService,
            tokensService,
            jwtService,
            config,
            sessionsService
        )
        return {
            sut,
            usersService,
            tokensService,
            jwtService,
            config,
            sessionsService,
        }
    }

    it('signup delegates to usersService.create and returns user', async () => {
        const { sut, usersService } = makeSut()
        const user = { id: 'u1', email: 'a@b.com' }
        usersService.create.mockResolvedValue(user)
        const res = await sut.signup('a@b.com', 'pw')
        expect(res).toBe(user)
        expect(usersService.create).toHaveBeenCalledWith({
            email: 'a@b.com',
            password: 'pw',
        })
    })

    it('validateUser returns user when password matches, null otherwise', async () => {
        const { sut, usersService } = makeSut()
        const plain = 'secret-password'
        const hash = await bcrypt.hash(plain, 10)
        const user = { id: 'u1', email: 'a@b.com', password: hash }
        usersService.findByEmail.mockResolvedValue(user)
        const ok = await sut.validateUser('a@b.com', plain)
        expect(ok).toBe(user)

        const no = await sut.validateUser('a@b.com', 'wrong')
        expect(no).toBeNull()

        usersService.findByEmail.mockResolvedValue(null)
        const none = await sut.validateUser('not@here', 'x')
        expect(none).toBeNull()
    })

    it('login signs tokens and stores refresh token', async () => {
        const { sut, tokensService, jwtService } = makeSut()
        const user = { id: 'u1', email: 'a@b.com', role: 'user' }
        jwtService.sign.mockImplementation((payload: any) => {
            if ((payload as any).email) return 'accessToken'
            return 'refreshToken'
        })
        const res = await sut.login(user as any)
        expect(res).toEqual({
            accessToken: 'accessToken',
            refreshToken: 'refreshToken',
        })
        expect(tokensService.storeRefreshToken).toHaveBeenCalledWith(
            'u1',
            'refreshToken'
        )
    })

    it('refresh validates token, verifies repo and issues new access token', async () => {
        const { sut, jwtService, tokensService, usersService } = makeSut()
        jwtService.verify.mockReturnValue({ userId: 'u1' })
        tokensService.validateRefreshToken.mockResolvedValue(true)
        usersService.findById.mockResolvedValue({
            id: 'u1',
            email: 'a@b.com',
            role: 'r',
        })
        jwtService.sign.mockImplementation((payload: any) => {
            // return 'newRefresh' only when signing the single-key refresh payload ({ userId })
            if (payload && Object.keys(payload).length === 1 && payload.userId)
                return 'newRefresh'
            return 'newAccess'
        })
        const res = await sut.refresh('u1', 'rtoken')
        expect(res).toEqual({
            accessToken: 'newAccess',
            refreshToken: 'newRefresh',
        })
    })

    it('refresh throws UnauthorizedException when verify fails', async () => {
        const { sut, jwtService } = makeSut()
        jwtService.verify.mockImplementation(() => {
            throw new Error('bad')
        })
        await expect(sut.refresh('u1', 'rtoken')).rejects.toThrow()
    })
})
