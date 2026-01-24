import { ConfigService } from '../config/config.service'

export async function startMailWorker(redisClient: any, config: ConfigService) {
    if (!redisClient) {
        console.warn('Mail worker: no redis client available, exiting')
        return
    }

    const queueKey = config.get('MAIL_QUEUE_KEY', 'mail:queue')

    // Simple polling worker using BRPOP with a timeout
    // eslint-disable-next-line no-constant-condition
    while (true) {
        try {
            // BRPOP returns [key, value] or null on timeout
            // Use 5 second timeout to allow graceful shutdown
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            const res = await redisClient.brpop(queueKey, 5)
            if (!res) continue
            const payload = JSON.parse(res[1])
            // In production, hand off to an email provider or background job
            console.log('Mail worker sending', payload)
        } catch (err) {
            console.error('Mail worker error', err)
            // backoff
            await new Promise((r) => setTimeout(r, 2000))
        }
    }
}

export default startMailWorker
