import { Module } from "@nestjs/common";
import { AppConfigModule } from "./config/config.module";

// 워커 전용 루트 모듈. 크롤링 · diff 큐 프로세서를 여기에 등록한다.
@Module({
  imports: [AppConfigModule],
})
export class WorkerModule {}
