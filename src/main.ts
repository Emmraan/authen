import 'reflect-metadata'
import { ValidationPipe } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import * as dotenv from 'dotenv'
import { HttpExceptionFilter } from './common/filters/http-exception.filter'

async function bootstrap() {
    dotenv.config()
    const app = await NestFactory.create(AppModule)
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }))
    app.useGlobalFilters(new HttpExceptionFilter())
    const port = process.env.PORT || 3000
    await app.listen(port)
    // eslint-disable-next-line no-console
    console.log(`Auth service listening on: http://localhost:${port}`)
}

bootstrap()
