export interface RateLimitResult {
    allowed: boolean
    remaining?: number
    resetAt?: number
}

export async function slidingWindowLimit(
    redis: any,
    key: string,
    limit: number,
    windowMs: number,
    member?: string
): Promise<RateLimitResult> {
    const now = Date.now()
    const windowStart = now - windowMs
    const memberId = member ?? `${now}`
    const ttlSeconds = Math.ceil(windowMs / 1000)

    // Use MULTI for atomicity
    const tx = redis.multi()
    tx.zadd(key, now.toString(), `${memberId}:${now}`)
    tx.zremrangebyscore(key, 0, windowStart.toString())
    tx.zcard(key)
    tx.expire(key, ttlSeconds)

    const [, , zcardRes] = await tx.exec()
    const count = Number(zcardRes[1])

    if (count > limit) {
        // compute resetAt as earliest score in window plus window
        const earliest = await redis.zrange(key, 0, 0, 'WITHSCORES')
        const earliestScore =
            earliest && earliest.length >= 2 ? Number(earliest[1]) : now
        return {
            allowed: false,
            remaining: 0,
            resetAt: earliestScore + windowMs,
        }
    }

    return {
        allowed: true,
        remaining: Math.max(0, limit - count),
        resetAt: now + windowMs,
    }
}

// Simple in-memory fallback limiter — not distributed, only use when Redis not available.
export class InMemoryLimiter {
    private map = new Map<string, number[]>()

    async limit(
        key: string,
        limit: number,
        windowMs: number
    ): Promise<RateLimitResult> {
        const now = Date.now()
        const arr = this.map.get(key) ?? []
        const windowStart = now - windowMs
        const filtered = arr.filter((ts) => ts > windowStart)
        filtered.push(now)
        this.map.set(key, filtered)
        const count = filtered.length
        if (count > limit) {
            const earliest = filtered[0] || now
            return {
                allowed: false,
                remaining: 0,
                resetAt: earliest + windowMs,
            }
        }
        return {
            allowed: true,
            remaining: Math.max(0, limit - count),
            resetAt: now + windowMs,
        }
    }
}
