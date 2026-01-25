import { ConfigService } from '../config/config.service'
import { execSync } from 'child_process'

export interface KeyProvider {
    getKeys(): string[]
}

export class EnvKeyProvider implements KeyProvider {
    constructor(private config: ConfigService) {}
    getKeys(): string[] {
        const raw =
            this.config.get('HMAC_SECRETS') ||
            this.config.get('HMAC_SECRET') ||
            ''
        const keys = raw
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean)
        if (keys.length > 0) return keys
        const env = process.env.HMAC_SECRET || ''
        return env ? [env] : []
    }
}

// Production-friendly Vault provider: attempts to read a KV v2 secret via Vault HTTP API
// Uses a synchronous curl exec as a safe fallback so KeyManager can remain sync.
export class VaultKeyProvider implements KeyProvider {
    constructor(private config: ConfigService) {}

    getKeys(): string[] {
        // prefer explicit VAULT_HMAC_SECRET if provided
        const explicit =
            this.config.get('VAULT_HMAC_SECRET') ||
            process.env.VAULT_HMAC_SECRET
        if (explicit)
            return explicit
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)

        const addr = this.config.get('VAULT_ADDR') || process.env.VAULT_ADDR
        const token = this.config.get('VAULT_TOKEN') || process.env.VAULT_TOKEN
        const path =
            this.config.get('VAULT_KV_PATH') ||
            process.env.VAULT_KV_PATH ||
            'hmac/keys'

        if (!addr || !token) return []

        try {
            // use curl synchronously to fetch secret (keeps API sync). Curl is available
            // on many platforms; this is a pragmatic approach for bootstrap scenarios.
            const url = `${addr.replace(/\/$/, '')}/v1/secret/data/${path}`
            const cmd = `curl -s -H "X-Vault-Token: ${token}" ${url}`
            const out = execSync(cmd, { encoding: 'utf8' })
            const parsed = JSON.parse(out || '{}')
            // Vault KV v2 stores secret at data.data
            const secretData = parsed && parsed.data && parsed.data.data
            if (!secretData) return []
            // support multiple shapes: HMAC_SECRETS string or direct value
            const raw =
                secretData.HMAC_SECRETS ||
                secretData.HMAC_SECRET ||
                secretData.value ||
                ''
            if (!raw) return []
            return String(raw)
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean)
        } catch {
            return []
        }
    }
}

export function selectProvider(config: ConfigService): KeyProvider {
    const provider =
        config.get('KMS_PROVIDER') || process.env.KMS_PROVIDER || 'env'
    if (provider === 'vault') return new VaultKeyProvider(config)
    return new EnvKeyProvider(config)
}
