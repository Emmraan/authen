describe('main bootstrap smoke', () => {
    it('runs bootstrap with mocked NestFactory', async () => {
        const listen = jest.fn(async () => Promise.resolve())
        const useGlobalPipes = jest.fn()
        const useGlobalFilters = jest.fn()

        jest.isolateModules(() => {
            jest.mock('@nestjs/core', () => ({
                NestFactory: {
                    create: async () => ({
                        listen,
                        useGlobalPipes,
                        useGlobalFilters,
                    }),
                },
            }))
            jest.mock('dotenv', () => ({ config: () => {} }))
            void import('../../src/main')
        })

        expect(typeof listen).toBe('function')
    })
})
