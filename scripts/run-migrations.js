require('dotenv').config()
const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const migrationsDir = path.resolve(__dirname, '../db/migrations')

async function run() {
    const files = fs.existsSync(migrationsDir)
        ? fs
              .readdirSync(migrationsDir)
              .filter((f) => f.endsWith('.sql'))
              .sort()
        : []

    if (files.length === 0) {
        console.log('No migration files found in', migrationsDir)
        process.exit(0)
    }

    const databaseUrl = process.env.DATABASE_URL || 'postgresql://authuser:authpass@localhost:5432/authdb'
    // Enable SSL for hosted providers (e.g., Supabase) when necessary.
    let clientOptions = { connectionString: databaseUrl }
    try {
        const parsed = new URL(databaseUrl)
        const host = parsed.hostname || ''
        if (
            host.includes('supabase') ||
            host.includes('rds') ||
            host.includes('aws')
        ) {
            clientOptions.ssl = { rejectUnauthorized: false }
        }
    } catch (e) {
        // ignore parsing errors; fall back to default client options
    }
    const client = new Client(clientOptions)

    try {
        await client.connect()
        console.log('Connected to', databaseUrl.replace(/:.+@/, ':*****@'))

        for (const file of files) {
            const filePath = path.join(migrationsDir, file)
            const sql = fs.readFileSync(filePath, 'utf8')
            console.log('Applying migration:', file)
            try {
                await client.query('BEGIN')
                await client.query(sql)
                await client.query('COMMIT')
                console.log('Applied', file)
            } catch (err) {
                console.error('Failed to apply', file, err.message || err)
                await client.query('ROLLBACK')
                throw err
            }
        }

        console.log('All migrations applied successfully.')
    } catch (err) {
        console.error(
            'Migration run failed:',
            err && err.stack ? err.stack : err
        )
        process.exitCode = 1
    } finally {
        await client.end().catch(() => {})
    }
}

run()
