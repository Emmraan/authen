import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'

describe('Auth (e2e)', () => {
    let app: INestApplication
    let server: any

    beforeAll(async () => {
        // ensure test env secrets
        process.env.JWT_ACCESS_TOKEN_SECRET =
            process.env.JWT_ACCESS_TOKEN_SECRET || 'test_access'
        process.env.JWT_REFRESH_TOKEN_SECRET =
            process.env.JWT_REFRESH_TOKEN_SECRET || 'test_refresh'
        process.env.JWT_ACCESS_TOKEN_EXPIRES_IN = '15m'
        process.env.JWT_REFRESH_TOKEN_EXPIRES_IN = '7d'

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

    it('/auth/signup -> /auth/login -> /auth/me -> /auth/refresh -> /auth/logout', async () => {
        const email = `e2e-${Date.now()}@example.com`
        const password = 'password123'

        // signup
        const signupRes = await request(server)
            .post('/auth/signup')
            .send({ email, password })
        expect(signupRes.status).toBeGreaterThanOrEqual(200)
        expect(signupRes.body).toHaveProperty('id')

        // login
        const loginRes = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect(loginRes.status).toBe(200)
        expect(loginRes.body).toHaveProperty('accessToken')
        expect(loginRes.body).toHaveProperty('refreshToken')

        const access = loginRes.body.accessToken
        const refresh = loginRes.body.refreshToken
        const userId = signupRes.body.id

        // me
        const meRes = await request(server)
            .get('/auth/me')
            .set('Authorization', `Bearer ${access}`)
        expect(meRes.status).toBe(200)
        expect(meRes.body).toHaveProperty('email', email)

        // refresh
        const refreshRes = await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken: refresh })
        expect(refreshRes.status).toBe(200)
        expect(refreshRes.body).toHaveProperty('accessToken')

        // logout
        const logoutRes = await request(server)
            .post('/auth/logout')
            .send({ userId, refreshToken: refresh })
        expect(logoutRes.status).toBe(200)
        expect(logoutRes.body).toHaveProperty('success', true)

        // refresh after logout should fail
        const refreshRes2 = await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken: refresh })
        expect(refreshRes2.status).toBeGreaterThanOrEqual(400)
    }, 20000)
})
