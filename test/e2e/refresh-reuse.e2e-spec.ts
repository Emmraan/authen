import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { getConnection } from 'typeorm'

describe('Refresh token reuse e2e', () => {
    let app: INestApplication
    let server: any

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()
        app = moduleRef.createNestApplication()
        await app.init()
        server = app.getHttpServer()
    })

    afterAll(async () => {
        try {
            const conn = getConnection()
            if (conn && conn.isConnected) await conn.close()
        } catch {
            // ignore
        }
        await app.close()
    })

    it('detects refresh token reuse and revokes sessions', async () => {
        const email = `reuser+${Date.now()}@example.com`
        const password = 'Password123!'

        // signup
        await request(server)
            .post('/auth/signup')
            .send({ email, password })
            .expect(201)

        // login -> get refresh token (R1)
        const loginRes = await request(server)
            .post('/auth/login')
            .send({ email, password })
            .expect(201)
        const r1 = loginRes.body.refreshToken

        // refresh -> rotate -> get R2
        const refresh1 = await request(server)
            .post('/auth/refresh')
            .send({ refreshToken: r1 })
            .expect(201)
        const r2 = refresh1.body.refreshToken

        // reuse old token R1 -> should trigger reuse detection and be rejected
        await request(server)
            .post('/auth/refresh')
            .send({ refreshToken: r1 })
            .expect(401)

        // after reuse detected, attempting to use R2 should also fail (all sessions revoked)
        await request(server)
            .post('/auth/refresh')
            .send({ refreshToken: r2 })
            .expect(401)

        // login again to obtain a fresh access token (account remains valid)
        const loginAfter = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect([200, 201]).toContain(loginAfter.status)
        const access = loginAfter.body.accessToken

        const sessionsRes = await request(server)
            .get('/auth/sessions')
            .set('Authorization', `Bearer ${access}`)
            .expect(200)
        const rows = sessionsRes.body
        // all sessions should be revoked
        expect(rows.every((r: any) => r.revokedAt)).toBeTruthy()
    }, 20000)
})
