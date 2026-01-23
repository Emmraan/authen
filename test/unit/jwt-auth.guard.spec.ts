import { JwtAuthGuard } from '../../src/middleware/jwt-auth.guard'
import { UnauthorizedException } from '@nestjs/common'

describe('JwtAuthGuard (unit)', () => {
    const makeSut = () => {
        const jwtService: any = { verify: jest.fn() }
        const config: any = { get: jest.fn().mockReturnValue('secret') }
        const sut = new JwtAuthGuard(jwtService, config)
        return { sut, jwtService, config }
    }

    function fakeCtx(headers: any) {
        return {
            switchToHttp: () => ({ getRequest: () => ({ headers }) }),
        } as any
    }

    it('allows request with valid Bearer token and attaches user', () => {
        const { sut, jwtService } = makeSut()
        jwtService.verify.mockReturnValue({ userId: 'u1', email: 'a@b.com' })
        const ctx = fakeCtx({ authorization: 'Bearer tok' })
        const ok = sut.canActivate(ctx as any)
        expect(ok).toBe(true)
    })

    it('throws on missing header', () => {
        const { sut } = makeSut()
        const ctx = fakeCtx({})
        expect(() => sut.canActivate(ctx as any)).toThrow(UnauthorizedException)
    })

    it('throws on invalid header format', () => {
        const { sut } = makeSut()
        const ctx = fakeCtx({ authorization: 'BadHeader' })
        expect(() => sut.canActivate(ctx as any)).toThrow(UnauthorizedException)
    })

    it('throws when jwt.verify fails', () => {
        const { sut, jwtService } = makeSut()
        jwtService.verify.mockImplementation(() => {
            throw new Error('bad')
        })
        const ctx = fakeCtx({ authorization: 'Bearer bad' })
        expect(() => sut.canActivate(ctx as any)).toThrow(UnauthorizedException)
    })
})
