import * as crypto from 'crypto'

export function generateRawToken(bytes = 48): string {
    return crypto.randomBytes(bytes).toString('hex')
}

// hash with a single key (legacy)
export function hashToken(token: string, hmacKey: string): string {
    return crypto.createHmac('sha256', hmacKey).update(token).digest('hex')
}

// New helper: try multiple keys for verification and always produce a hash
export function hashWithKeys(
    token: string,
    keys: string[]
): { hash: string; matchedKeyIndex: number | null } {
    for (let i = 0; i < keys.length; i++) {
        const candidate = crypto
            .createHmac('sha256', keys[i])
            .update(token)
            .digest('hex')
        // We return the first computed hash and mark if it matched (match detection done by caller using safeCompare)
        if (i === 0) return { hash: candidate, matchedKeyIndex: null }
    }
    // fallback (shouldn't reach)
    const fallback = crypto
        .createHmac('sha256', keys[0] || '')
        .update(token)
        .digest('hex')
    return { hash: fallback, matchedKeyIndex: null }
}

export function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}
