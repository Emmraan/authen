import { Injectable } from '@nestjs/common'
import * as dotenv from 'dotenv'

dotenv.config()

@Injectable()
export class ConfigService {
    get(key: string, defaultValue?: string): string {
        return process.env[key] ?? defaultValue ?? ''
    }

    getNumber(key: string, defaultValue = 0): number {
        const v = this.get(key)
        return v ? Number(v) : defaultValue
    }

    getBool(key: string, defaultValue = false): boolean {
        const v = this.get(key)
        if (!v) return defaultValue
        return v === 'true' || v === '1'
    }
}
