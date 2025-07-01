import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { LoggingInterceptor } from 'src/common/interceptors/logging.interceptor';
import { TransformInterceptor } from 'src/common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from 'src/common/filters/http-exception.filter';
import { ChronicleConfigService } from 'src/common/services/chronicle-config.service';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import compress from '@fastify/compress';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { EnvKeys } from './common/types/EnvKeys.enum';
import { assertNoMissingEnvVariables } from './helpers/functions/common/assert-no-missing-env-variables.function';

async function bootstrap() {
  assertNoMissingEnvVariables();

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: {
        level: process.env.LOG_LEVEL || 'info',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
    }),
  );

  const configService = app.get(ChronicleConfigService);

  // Register Fastify plugins
  const originsString = configService.get(EnvKeys.ALLOWED_ORIGINS);
  const origins =
    typeof originsString === 'string'
      ? originsString.split(',').map((origin) => origin.trim())
      : ['http://localhost:3001'];

  await app.register(cors, {
    origin: origins,
    credentials: true,
  });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'https:'],
        scriptSrc: [`'self'`],
      },
    },
  });

  await app.register(compress, {
    threshold: 1024,
  });

  await app.register(rateLimit, {
    max: configService.get(EnvKeys.RATE_LIMIT_MAX, 100),
    timeWindow: configService.get(EnvKeys.RATE_LIMIT_WINDOW, 60000),
  });

  await app.register(multipart, {
    limits: {
      fileSize: configService.get(EnvKeys.MAX_FILE_SIZE, 10 * 1024 * 1024),
    },
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      errorHttpStatusCode: 422,
    }),
  );

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Global filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('API Request Recorder')
    .setDescription('Central service for recording and replaying API requests')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'api-key')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = configService.get<number>(EnvKeys.PORT, 3000);
  const host = configService.get<string>(EnvKeys.HOST, '0.0.0.0');

  await app.listen(port, host);
  console.log(`🚀 API Request Recorder running on http://${host}:${port}`);
  console.log(`📚 Documentation available at http://${host}:${port}/docs`);
}

void bootstrap();
