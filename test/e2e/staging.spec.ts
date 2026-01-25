import request from 'supertest'
import { NestFactory } from '@nestjs/core'
import { AppModule } from '../../src/app.module'

describe('Staging E2E smoke tests', () => {
    let app: any
    let server: any

    beforeAll(async () => {
        const port = parseInt(process.env.PORT || '3000', 10)
        app = await NestFactory.create(AppModule)
        await app.listen(port)
        server = app.getHttpServer()
    })

    afterAll(async () => {
        if (app) await app.close()
    })

    const random = Math.random().toString(36).slice(2, 8)
    const email = `e2e+${random}@example.com`
    const password = 'Str0ngP@ssw0rd!'
    let userId: string
    let refreshToken: string

    it('signup -> should create user', async () => {
        const res = await request(server)
            .post('/auth/signup')
            .send({ email, password })
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('id')
        userId = res.body.id
    })

    it('login -> should return tokens', async () => {
        const res = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
        refreshToken = res.body.refreshToken
    })

    it('me -> should return user when passing access token', async () => {
        const login = await request(server)
            .post('/auth/login')
            .send({ email, password })
        const token = login.body.accessToken
        const res = await request(server)
            .get('/auth/me')
            .set('Authorization', `Bearer ${token}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('email', email)
    })

    it('refresh -> should rotate refresh token', async () => {
        const res = await request(server)
            .post('/auth/refresh')
            .send({ userId, refreshToken })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('accessToken')
        expect(res.body).toHaveProperty('refreshToken')
    })

    it('logout -> should succeed', async () => {
        const res = await request(server)
            .post('/auth/logout')
            .send({ userId, refreshToken })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('success', true)
    })
})
