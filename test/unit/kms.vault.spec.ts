import { VaultKeyProvider } from '../../src/utils/kms.provider'
import { execSync } from 'child_process'

jest.mock('child_process', () => ({
    execSync: jest.fn(),
}));

describe('VaultKeyProvider', () => {
    beforeEach(() => {
        const mocked = execSync as jest.Mock
        mocked.mockReset()
    })

    test('falls back to VAULT_HMAC_SECRET when set', () => {
        const c = {
            get: (k: string) => (k === 'VAULT_HMAC_SECRET' ? 'a,b' : ''),
        } as any
        const p = new VaultKeyProvider(c)
        expect(p.getKeys()).toEqual(['a', 'b'])
    })

    test('reads from vault via curl when addr and token present', () => {
        const payload = '{"data":{"data":{"HMAC_SECRETS":"x,y"}}}'
        const mocked = execSync as jest.Mock
        mocked.mockReturnValueOnce(payload)
        const c = {
            get: (k: string) => {
                const map: Record<string, string> = {
                    VAULT_ADDR: 'https://vault.example',
                    VAULT_TOKEN: 't',
                    VAULT_KV_PATH: 'hmac/keys',
                }
                return map[k] || ''
            },
        } as any
        const p = new VaultKeyProvider(c)
        expect(p.getKeys()).toEqual(['x', 'y'])
        expect(execSync).toHaveBeenCalled()
    })

    test('returns empty array on errors', () => {
        const mocked = execSync as jest.Mock
        mocked.mockImplementationOnce(() => {
            throw new Error('fail')
        })
        const c = {
            get: (k: string) => {
                const map: Record<string, string> = {
                    VAULT_ADDR: 'https://vault.example',
                    VAULT_TOKEN: 't',
                    VAULT_KV_PATH: 'hmac/keys',
                }
                return map[k] || ''
            },
        } as any
        const p = new VaultKeyProvider(c)
        expect(p.getKeys()).toEqual([])
    })
})
