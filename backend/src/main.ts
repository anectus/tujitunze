import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody: true preserves the exact bytes on req.rawBody alongside the
  // normal parsed req.body — needed by TelecomWebhookSignatureGuard to
  // verify an HMAC computed by the caller over the literal request
  // bytes, not a re-serialization of the parsed object (which could
  // legitimately differ in key order/number formatting and break a
  // correct signature).
  const app = await NestFactory.create(AppModule, { rawBody: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed =
        !origin ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        origin === process.env.FRONTEND_URL;

      callback(allowed ? null : new Error('Not allowed by CORS'), allowed);
    },
  });
  // Explicit '0.0.0.0': accept connections on every interface, not just
  // loopback, so a device other than this host can reach the API
  // through the port Docker publishes (see docker-compose.yml). Node
  // already defaults to this when no host is given, but it's made
  // explicit rather than relied on implicitly.
  await app.listen(process.env.PORT ?? 3002, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
