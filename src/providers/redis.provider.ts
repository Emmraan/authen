/* eslint-disable @typescript-eslint/no-require-imports */
import { Provider } from '@nestjs/common'
import { ConfigService } from '../config/config.service'

// Dynamically require ioredis to avoid type resolution errors in environments
// where the module may not be installed (tests/CI without Redis). The provider
// will return null if `ioredis` is unavailable.
let IORedis: any = null
try {
    // use require intentionally to optionally load runtime dependency
    IORedis = require('ioredis')
} catch {
    IORedis = null
}

export const REDIS_CLIENT = 'REDIS_CLIENT'

export const RedisProvider: Provider = {
    provide: REDIS_CLIENT,
    useFactory: (config: ConfigService) => {
        const url = config.get('RATE_LIMIT_REDIS_URL')
        if (!url || !IORedis) return null
        return new IORedis(url)
    },
    inject: [ConfigService],
}
