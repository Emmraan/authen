import * as crypto from 'crypto'

export function generateRawToken(bytes = 48): string {
    return crypto.randomBytes(bytes).toString('hex')
}

export function hashToken(token: string, hmacKey: string): string {
    return crypto.createHmac('sha256', hmacKey).update(token).digest('hex')
}

export function safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    if (bufA.length !== bufB.length) return false
    return crypto.timingSafeEqual(bufA, bufB)
}
