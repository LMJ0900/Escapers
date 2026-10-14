import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { AppModule } from "./app.module";
import type { Env } from "./config/env";

// API 서버 엔트리 (백엔드 명세서 §2.2)
async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter()
  );
  const config = app.get(ConfigService<Env, true>);

  // 쿠키를 쓰지 않으므로 credentials: false (프론트 withCredentials: false 와 일치)
  app.enableCors({ origin: config.get("CORS_ORIGIN"), credentials: false });
  app.enableShutdownHooks();

  await app.listen({ port: config.get("PORT"), host: "0.0.0.0" });
}
void bootstrap();
