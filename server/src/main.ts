import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import session, { MemoryStore } from 'express-session';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = process.env.PORT || 3001;

  app.enableCors();

  await app.listen(port, () => {
    console.log('[WEB]', 'http://localhost:' + port);
  });
}
bootstrap();
