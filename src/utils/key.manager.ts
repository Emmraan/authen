import { Injectable } from '@nestjs/common'
import { ConfigService } from '../config/config.service'
import { selectProvider } from './kms.provider'

@Injectable()
export class KeyManager {
    private keys: string[] = []
    constructor(private config: ConfigService) {
        const provider = selectProvider(this.config)
        const k = provider.getKeys()
        // keep previous fallback behavior: if nothing provided, fallback to env
        if (!k || k.length === 0) {
            const raw = process.env.HMAC_SECRET || ''
            this.keys = raw ? [raw] : ['']
        } else {
            this.keys = k.slice()
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
