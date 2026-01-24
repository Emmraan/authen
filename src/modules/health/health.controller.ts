import { Controller, Get } from '@nestjs/common'

@Controller()
export class HealthController {
    @Get('/')
    root() {
        return {
            status: 'ok',
            service: process.env.npm_package_name || 'auth-service',
            version: process.env.npm_package_version || 'dev',
        }
    }

    @Get('/health')
    health() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            timestamp: Date.now(),
        }
    }
}
