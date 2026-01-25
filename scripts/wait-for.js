const http = require('http')
const https = require('https')
const { URL } = require('url')

function waitFor(url, timeout = 30000, interval = 1000) {
    const parsed = new URL(url)
    const lib = parsed.protocol === 'https:' ? https : http

    return new Promise((resolve, reject) => {
        const start = Date.now()
        const tryOnce = () => {
            const req = lib.request(
                {
                    method: 'GET',
                    hostname: parsed.hostname,
                    port: parsed.port,
                    path: parsed.pathname || '/',
                    timeout: 5000,
                },
                (res) => {
                    if (res.statusCode >= 200 && res.statusCode < 400)
                        return resolve()
                    if (Date.now() - start > timeout)
                        return reject(new Error('timeout'))
                    setTimeout(tryOnce, interval)
                }
            )
            req.on('error', () => {
                if (Date.now() - start > timeout)
                    return reject(new Error('timeout'))
                setTimeout(tryOnce, interval)
            })
            req.end()
        }
        tryOnce()
    })
}

if (require.main === module) {
    const url =
        process.argv[2] ||
        process.env.HEALTH_URL ||
        'http://localhost:3000/health'
    const timeout =
        Number(process.argv[3]) || Number(process.env.WAIT_TIMEOUT) || 30000
    console.log('Waiting for', url)
    waitFor(url, timeout)
        .then(() => {
            console.log('Service is ready')
            process.exit(0)
        })
        .catch((err) => {
            console.error('Service did not become ready:', err && err.message)
            process.exit(2)
        })
}
