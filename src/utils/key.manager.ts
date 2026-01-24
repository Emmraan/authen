import { Injectable } from '@nestjs/common'
import { ConfigService } from '../config/config.service'

@Injectable()
export class KeyManager {
    private keys: string[]
    constructor(private config: ConfigService) {
        // Read HMAC keys from config as a comma-separated list, first is primary
        const raw =
            this.config.get('HMAC_SECRETS') ||
            this.config.get('HMAC_SECRET') ||
            ''
        this.keys = raw
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        if (this.keys.length === 0) {
            // fallback to an environment variable or empty string
            const env = process.env.HMAC_SECRET || ''
            this.keys = env ? [env] : ['']
        }
    }

    // primary key
    primary(): string {
        return this.keys[0]
    }

    // all keys ordered primary -> older
    all(): string[] {
        return this.keys.slice()
    }
}
