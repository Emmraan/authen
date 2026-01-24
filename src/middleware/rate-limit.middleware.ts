import { Injectable, NestMiddleware, Logger, Inject } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { slidingWindowLimit, InMemoryLimiter } from '../utils/rate-limit.util'
import { REDIS_CLIENT } from '../providers/redis.provider'

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    private logger = new Logger(RateLimitMiddleware.name)
    private inMemory = new InMemoryLimiter()
    constructor(@Inject(REDIS_CLIENT) private redisClient: any) {}

    async use(req: Request, res: Response, next: NextFunction) {
        try {
            const redis = this.redisClient ?? null
            const ip =
                (req.headers['x-forwarded-for'] as string) ||
                req.ip ||
                req.connection.remoteAddress ||
                'unknown'
            const path = req.path || req.originalUrl || 'unknown'

            // Only apply to sensitive endpoints — adjust as needed
            const sensitivePaths = [
                '/auth/login',
                '/auth/forgot-password',
                '/auth/reset-password',
            ]
            if (!sensitivePaths.includes(path)) return next()

            // IP-level limit
            const ipKey = `rl:ip:${ip}:${path}`
            const ipLimit = Number(process.env.RATE_LIMIT_LOGIN_IP) || 100
            const ipWindow =
                Number(process.env.RATE_LIMIT_LOGIN_IP_WINDOW_MS) ||
                15 * 60 * 1000

            let ipResult
            if (redis) {
                ipResult = await slidingWindowLimit(
                    redis,
                    ipKey,
                    ipLimit,
                    ipWindow,
                    ip
                )
            } else {
                ipResult = await this.inMemory.limit(ipKey, ipLimit, ipWindow)
            }

            if (!ipResult.allowed) {
                const retryAfter = Math.ceil(
                    ((ipResult.resetAt ?? Date.now()) - Date.now()) / 1000
                )
                res.setHeader('Retry-After', String(retryAfter))
                return res
                    .status(429)
                    .json({ statusCode: 429, message: 'Too many requests' })
            }

            // Account-level limit (if email provided)
            const body = req.body as any
            if (body && body.email) {
                const acct = String(body.email).toLowerCase()
                const acctKey = `rl:acct:${acct}:${path}`
                const acctLimit = Number(process.env.RATE_LIMIT_LOGIN_ACCT) || 5
                const acctWindow =
                    Number(process.env.RATE_LIMIT_LOGIN_ACCT_WINDOW_MS) ||
                    15 * 60 * 1000
                let acctResult
                if (redis) {
                    acctResult = await slidingWindowLimit(
                        redis,
                        acctKey,
                        acctLimit,
                        acctWindow,
                        acct
                    )
                } else {
                    acctResult = await this.inMemory.limit(
                        acctKey,
                        acctLimit,
                        acctWindow
                    )
                }
                if (!acctResult.allowed) {
                    const retryAfter = Math.ceil(
                        ((acctResult.resetAt ?? Date.now()) - Date.now()) / 1000
                    )
                    res.setHeader('Retry-After', String(retryAfter))
                    return res
                        .status(429)
                        .json({ statusCode: 429, message: 'Too many requests' })
                }
            }

            // Attach remaining info for logging/metrics
            res.setHeader('X-RateLimit-Limit', String(ipLimit))
            res.setHeader(
                'X-RateLimit-Remaining',
                String(ipResult.remaining ?? 0)
            )
            return next()
        } catch (err) {
            this.logger.warn(
                'Rate limiter error, allowing request and falling back: ' +
                    String(err)
            )
            return next()
        }
    }
}
