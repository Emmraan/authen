module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/*.spec.ts'],
    moduleFileExtensions: ['ts', 'js', 'json', 'node'],
    roots: ['<rootDir>/test'],
    testPathIgnorePatterns: [],
    collectCoverage: true,
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.spec.ts',
        '!test/**',
        '!src/integration/**',
        '!src/config/config.service.ts',
        '!src/common/filters/http-exception.filter.ts',
    ],
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    },
    coverageThreshold: {
        global: {
            statements: 68,
            branches: 60,
            functions: 41,
            lines: 65,
        },
    },
}
