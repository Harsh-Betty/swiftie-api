import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { Logger } from 'nestjs-pino';
import {
  DATA_PACKAGE_NAME,
  readDataPackageVersion,
  SERVER_PACKAGE_NAME,
  SERVER_VERSION,
} from './app.constants';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AppConfigService } from './config/config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  app.useLogger(app.get(Logger));

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new LoggingInterceptor(), new TransformInterceptor(app.get(Reflector)));

  app.enableCors({
    origin: '*',
    methods: ['GET', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  });

  app.enableShutdownHooks();

  const dataVersion = readDataPackageVersion();
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Swiftie API')
    .setDescription(
      [
        'A free, open-source, fan-made API for Taylor Swift discography, lyrics, eras, and metadata.',
        '',
        `Powered by ${DATA_PACKAGE_NAME}@${dataVersion}.`,
        '',
        'If you find this useful, [buy me a coffee](https://buymeacoffee.com/hrshvrdhn).',
        '',
        '**Disclaimer:** Swiftie API is a fan-made project. It is not affiliated with, endorsed by, or sponsored by Taylor Swift, her management, her record labels, or any rights-holder.',
      ].join('\n'),
    )
    .setVersion(SERVER_VERSION)
    .setContact('Harshvardhan Singh', 'https://github.com/Harsh-Betty/swiftie-api', '')
    .setLicense('MIT', 'https://github.com/Harsh-Betty/swiftie-api/blob/main/LICENSE')
    .addServer('http://localhost:3000', 'local')
    .addServer('https://swiftie-api.hrshvrdhn.com', 'production')
    .addTag('health', 'Liveness and readiness probes.')
    .addTag('meta', 'API metadata and dataset counts.')
    .addTag('albums', "Studio albums and Taylor's Versions with filtering.")
    .addTag('songs', 'Individual songs with optional lyrics payload.')
    .addTag('lyrics', 'Full-text lyrics search and per-song structured lyrics.')
    .addTag('quotes', 'Curated and deterministic-daily lyric quotes.')
    .addTag('eras', 'High-level era groupings with hydrated album listings.')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('api/v1/docs', app, document, {
    ui: false,
    raw: ['json'],
  });

  const fastify = app.getHttpAdapter().getInstance();
  const scalarHandler = apiReference({
    content: document,
    withFastify: true,
    theme: 'mars',
    metaData: { title: 'Swiftie API · Reference' },
  }) as (req: unknown, res: unknown) => void;

  // Scalar's `withFastify: true` handler writes directly to a Node ServerResponse
  // (`res.writeHead` / `res.write` / `res.end`). Fastify's `reply` object doesn't
  // expose those methods, so we hijack the reply and pass the raw ServerResponse.
  fastify.get('/api/v1/docs', (request, reply) => {
    reply.hijack();
    scalarHandler(request, reply.raw);
  });

  const cfg = app.get(AppConfigService);
  const port = cfg.get('PORT');

  await app.listen(port, '0.0.0.0');

  const url = await app.getUrl();
  const logger = app.get(Logger);
  logger.log(
    `${SERVER_PACKAGE_NAME} v${SERVER_VERSION} listening at ${url} (env=${cfg.get('NODE_ENV')})`,
  );
  logger.log(`Scalar API reference: ${url}/api/v1/docs`);
  logger.log(`OpenAPI JSON:        ${url}/api/v1/docs-json`);
}

void bootstrap();
