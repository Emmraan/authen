import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { AppModule } from '../../src/app.module'

describe('Auth negative e2e', () => {
    let app: INestApplication
    let server: any

    beforeAll(async () => {
        process.env.JWT_ACCESS_TOKEN_SECRET =
            process.env.JWT_ACCESS_TOKEN_SECRET || 'test_access'
        process.env.JWT_REFRESH_TOKEN_SECRET =
            process.env.JWT_REFRESH_TOKEN_SECRET || 'test_refresh'

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

    it('signup missing fields -> 400', async () => {
        const res = await request(server)
            .post('/auth/signup')
            .send({ email: 'a@b.com' })
        expect(res.status).toBe(400)
    })

    it('login wrong password -> 401', async () => {
        const email = `e2e-${Date.now()}@ex.com`
        const password = 'pwd123'
        await request(server).post('/auth/signup').send({ email, password })
        const res = await request(server)
            .post('/auth/login')
            .send({ email, password: 'bad' })
        expect(res.status).toBeGreaterThanOrEqual(400)
    })

    it('protected route without token -> 401', async () => {
        const res = await request(server).get('/auth/me')
        expect(res.status).toBeGreaterThanOrEqual(400)
    })
})
