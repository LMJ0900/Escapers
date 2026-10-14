import { ConfigModule } from "@nestjs/config";
import { validateEnv } from "./env";

// API · 워커가 공유하는 환경변수 모듈. backend/.env 를 읽어 zod 로 검증한다.
export const AppConfigModule = ConfigModule.forRoot({
  isGlobal: true,
  validate: validateEnv,
});
