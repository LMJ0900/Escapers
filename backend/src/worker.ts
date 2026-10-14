import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { WorkerModule } from "./worker.module";

// 워커 엔트리 (백엔드 명세서 §2.2). HTTP 서버 없이 애플리케이션 컨텍스트만 띄운다.
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule);
  // SIGTERM 등 수신 시 모듈의 종료 훅을 실행해 진행 중 작업을 마치고 종료한다 (§9.2)
  app.enableShutdownHooks();
  new Logger("Worker").log("워커가 시작되었습니다.");
}
void bootstrap();
