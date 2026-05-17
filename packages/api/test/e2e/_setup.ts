import 'reflect-metadata';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../../src/common/interceptors/transform.interceptor';

export interface TestAppOptions {
  withSwagger?: boolean;
}

export async function createTestApp(options: TestAppOptions = {}): Promise<NestFastifyApplication> {
  process.env.NODE_ENV = 'test';

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { logger: false },
  );

  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor(app.get(Reflector)));

  if (options.withSwagger) {
    const swaggerConfig = new DocumentBuilder().setTitle('Swiftie API').setVersion('0.0.0').build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document, { ui: false, raw: ['json'] });

    const fastify = app.getHttpAdapter().getInstance();
    const scalarHandler = apiReference({
      content: document,
      withFastify: true,
    }) as (req: unknown, res: unknown) => void;
    fastify.get('/api/v1/docs', (request, reply) => {
      reply.hijack();
      scalarHandler(request, reply.raw);
    });
  }

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
}
