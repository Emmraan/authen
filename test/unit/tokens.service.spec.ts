import { TokensService } from '../../src/modules/tokens/tokens.service'
import { UnauthorizedException } from '@nestjs/common'

describe('TokensService (unit)', () => {
    const makeSut = () => {
        const repo: any = {
            add: jest.fn(),
            exists: jest.fn(),
            remove: jest.fn(),
            removeAllForUser: jest.fn(),
        }
        const sut = new TokensService(repo)
        return { sut, repo }
    }

    it('storeRefreshToken calls repo.add', async () => {
        const { sut, repo } = makeSut()
        await sut.storeRefreshToken('u1', 'rt')
        expect(repo.add).toHaveBeenCalledWith('u1', 'rt')
    })

    it('validateRefreshToken throws when not exists', async () => {
        const { sut, repo } = makeSut()
        repo.exists.mockResolvedValue(false)
        await expect(sut.validateRefreshToken('u1', 'rt')).rejects.toThrow(
            UnauthorizedException
        )
    })

    it('validateRefreshToken returns true when exists', async () => {
        const { sut, repo } = makeSut()
        repo.exists.mockResolvedValue(true)
        await expect(sut.validateRefreshToken('u1', 'rt')).resolves.toBe(true)
    })

    it('revokeRefreshToken and revokeAll delegate to repo', async () => {
        const { sut, repo } = makeSut()
        await sut.revokeRefreshToken('u1', 'rt')
        expect(repo.remove).toHaveBeenCalledWith('u1', 'rt')
        await sut.revokeAll('u1')
        expect(repo.removeAllForUser).toHaveBeenCalledWith('u1')
    })
})
