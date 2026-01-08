import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOptions } from './cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(corsOptions);
  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
