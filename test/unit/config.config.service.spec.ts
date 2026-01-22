import { ConfigService } from '../../src/config/config.service'

describe('ConfigService (unit)', () => {
    it('reads env values', () => {
        const cfg = new ConfigService()
        process.env.TEST_CFG = '1'
        expect(cfg.get('TEST_CFG')).toBe('1')
    })
})
