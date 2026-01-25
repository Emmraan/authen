import request from 'supertest'
import { INestApplication, HttpStatus } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AppModule } from '../../src/app.module'
import { MailService } from '../../src/utils/mail.service'

class TestMailService {
    public verificationEmails: Array<{
        to: string
        token: string
        link: string
    }> = []
    public resetEmails: Array<{ to: string; token: string; link: string }> = []

    async sendVerificationEmail(to: string, token: string, opts: any) {
        const link = `${opts && opts.frontendUrl ? opts.frontendUrl : 'https://app.example.com'}/verify-email?token=${encodeURIComponent(token)}`
        this.verificationEmails.push({ to, token, link })
    }

    async sendPasswordResetEmail(to: string, token: string, opts: any) {
        const link = `${opts && opts.frontendUrl ? opts.frontendUrl : 'https://app.example.com'}/reset-password?token=${encodeURIComponent(token)}`
        this.resetEmails.push({ to, token, link })
    }
}

describe('Email flows e2e', () => {
    let app: INestApplication
    let server: any
    let mailStub: TestMailService

    beforeAll(async () => {
        mailStub = new TestMailService()
        const moduleRef = await Test.createTestingModule({
            imports: [AppModule],
        })
            .overrideProvider(MailService)
            .useValue(mailStub as any)
            .compile()
        app = moduleRef.createNestApplication()
        await app.init()
        server = app.getHttpServer()
    })

    afterAll(async () => {
        await app.close()
    })

    it('signup -> resend-verification -> verify-email -> login allowed', async () => {
        const email = `verify+${Date.now()}@example.com`
        const password = 'Password123!'

        // signup
        await request(server)
            .post('/auth/signup')
            .send({ email, password })
            .expect(HttpStatus.CREATED)

        // resend verification -> should enqueue a verification email
        await request(server)
            .post('/auth/resend-verification')
            .send({ email })
            .expect(HttpStatus.OK)
        expect(mailStub.verificationEmails.length).toBeGreaterThanOrEqual(1)
        const token =
            mailStub.verificationEmails[mailStub.verificationEmails.length - 1]
                .token

        // verify-email
        await request(server)
            .post('/auth/verify-email')
            .send({ token })
            .expect(HttpStatus.OK)

        // login should be allowed
        const login = await request(server)
            .post('/auth/login')
            .send({ email, password })
        expect([200, 201]).toContain(login.status)
    }, 20000)

    it('resend -> old token invalid -> new token works', async () => {
        const email = `resend+${Date.now()}@example.com`
        const password = 'Password123!'

        // signup
        await request(server)
            .post('/auth/signup')
            .send({ email, password })
            .expect(HttpStatus.CREATED)

        // first resend
        await request(server)
            .post('/auth/resend-verification')
            .send({ email })
            .expect(HttpStatus.OK)
        expect(mailStub.verificationEmails.length).toBeGreaterThanOrEqual(1)
        const first =
            mailStub.verificationEmails[mailStub.verificationEmails.length - 1]
                .token

        // second resend
        await request(server)
            .post('/auth/resend-verification')
            .send({ email })
            .expect(HttpStatus.OK)
        const second =
            mailStub.verificationEmails[mailStub.verificationEmails.length - 1]
                .token
        expect(second).toBeTruthy()
        expect(second).not.toBe(first)

        // old token should fail
        await request(server)
            .post('/auth/verify-email')
            .send({ token: first })
            .expect(HttpStatus.INTERNAL_SERVER_ERROR)

        // new token should succeed
        await request(server)
            .post('/auth/verify-email')
            .send({ token: second })
            .expect(HttpStatus.OK)
    }, 20000)

    it('forgot-password -> reset-password -> login with new password', async () => {
        const email = `reset+${Date.now()}@example.com`
        const password = 'Password123!'
        const newPassword = 'NewPassword123!'

        // signup
        await request(server)
            .post('/auth/signup')
            .send({ email, password })
            .expect(HttpStatus.CREATED)

        // trigger forgot-password
        await request(server)
            .post('/auth/forgot-password')
            .send({ email })
            .expect(HttpStatus.OK)
        expect(mailStub.resetEmails.length).toBeGreaterThanOrEqual(1)
        const token =
            mailStub.resetEmails[mailStub.resetEmails.length - 1].token

        // reset password
        await request(server)
            .post('/auth/reset-password')
            .send({ token, newPassword })
            .expect(HttpStatus.OK)

        // login with old password should fail
        await request(server)
            .post('/auth/login')
            .send({ email, password })
            .expect(HttpStatus.UNAUTHORIZED)

        // login with new password should succeed
        const login = await request(server)
            .post('/auth/login')
            .send({ email, password: newPassword })
        expect([200, 201]).toContain(login.status)
    }, 20000)
})
