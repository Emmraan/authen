import request from 'supertest'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'

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
        await app.close()
    })

    it('detects refresh token reuse and revokes sessions', async () => {
        const email = `reuser+${Date.now()}@example.com`
        const password = 'Password123!'

        // signup
        const signupRes = await request(server)
            .post('/auth/signup')
            .send({ email, password })
            .expect(201)
        const userId = signupRes.body.id

        // login -> get refresh token (R1)
        const loginRes = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect([200, 201]).toContain(loginRes.status)
        const r1 = loginRes.body.refreshToken
        const sessionId = loginRes.body.sessionId

        // refresh -> rotate -> get R2
        const refresh1 = await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken: r1, sessionId })
        expect([200, 201]).toContain(refresh1.status)
        const r2 = refresh1.body.refreshToken

        // debug logs removed

        // check session state after first refresh
        const accessAfterRefresh = refresh1.body.accessToken

        // reuse old token R1 -> should trigger reuse detection and be rejected
        await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken: r1, sessionId })
            .expect(401)

        // after reuse detected, attempting to use R2 should also fail
        await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken: r2, sessionId })
            .expect(401)

        // verify previous session was revoked (use the previous access token)
        const sessionsAfterReuse = await request(server)
            .get('/auth/sessions')
            .set('Authorization', `Bearer ${accessAfterRefresh}`)
            .expect(200)
        const rowsAfterReuse = sessionsAfterReuse.body
        expect(rowsAfterReuse.some((r: any) => r.revokedAt)).toBeTruthy()

        // login again to obtain a fresh access token (account remains valid)
        const loginAfter = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect([200, 201]).toContain(loginAfter.status)
    }, 20000)
})
