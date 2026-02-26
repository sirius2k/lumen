import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.enableCors({
    origin: ['http://localhost:3050', 'http://localhost:3000'],
    credentials: true,
  });

  const port = process.env.PORT || 3051;
  await app.listen(port);
  console.log(`🚀 Lumen API running on: http://localhost:${port}/api`);
}

bootstrap();
