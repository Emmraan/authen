let selectMailProvider: any
let SmtpMailProvider: any
let mod: any

const mockSendMail = jest.fn(async () => ({ messageId: 'mock-id' }))
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }))

describe('SmtpMailProvider', () => {
    beforeAll(async () => {
        mod = await import('../../src/utils/mail.provider')
        selectMailProvider = mod.selectMailProvider
        SmtpMailProvider = mod.SmtpMailProvider
        // override the dynamic loader to avoid requiring nodemailer
        mod._loadNodemailer = async () => ({
            createTransport: mockCreateTransport,
            default: { createTransport: mockCreateTransport },
        })
    })

    beforeEach(() => {
        mockSendMail.mockClear()
        mockCreateTransport.mockClear()
    })

    test('uses nodemailer transport when MAIL_DIRECT is true', async () => {
        const config = {
            get: (k: string) => {
                const map: Record<string, string> = {
                    SMTP_HOST: 'smtp.example.com',
                    SMTP_PORT: '587',
                    SMTP_USER: 'user',
                    SMTP_PASS: 'pass',
                    SMTP_FROM: 'no-reply@example.com',
                    MAIL_DIRECT: 'true',
                }
                return map[k]
            },
        } as any

        const provider = selectMailProvider(config)
        expect(provider).toBeInstanceOf(SmtpMailProvider)

        await provider.send({
            to: 'u@example.com',
            subject: 'Hi',
            text: 'hello',
        })

        expect(mockCreateTransport).toHaveBeenCalled()
        expect(mockSendMail).toHaveBeenCalledWith(
            expect.objectContaining({ to: 'u@example.com', subject: 'Hi' })
        )
    })
})
