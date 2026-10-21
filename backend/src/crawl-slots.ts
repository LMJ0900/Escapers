import { Logger, Module } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppConfigModule } from "./config/config.module";
import { PrismaModule } from "./infra/prisma/prisma.module";
import { AdapterRegistry } from "./modules/crawler/adapters/adapter.registry";
import { CrawlerModule } from "./modules/crawler/crawler.module";
import { SlotCrawlService } from "./modules/crawler/slot-crawl.service";

// 빈자리(슬롯) 수집 수동 실행 CLI (백엔드 명세서 §7.2). 자동 감시(BullMQ)는 이후 추가한다.
//   node dist/crawl-slots <adapterKey | all> [days]
@Module({ imports: [AppConfigModule, PrismaModule, CrawlerModule] })
class CrawlSlotsCliModule {}

/** 테마 상세의 예약 가능 시간 기간(theme.service SLOT_DAYS)과 맞춘다 */
const DEFAULT_DAYS = 7;
const MAX_DAYS = 14;

async function main() {
  const logger = new Logger("CrawlSlots");
  const [target, daysArg] = process.argv.slice(2);
  const days = daysArg ? Number(daysArg) : DEFAULT_DAYS;
  const app = await NestFactory.createApplicationContext(CrawlSlotsCliModule, {
    logger: ["log", "warn", "error"],
  });

  try {
    const registry = app.get(AdapterRegistry);
    const crawler = app.get(SlotCrawlService);
    const supported = registry.keys().filter((key) => crawler.supports(key));
    if (!target) {
      logger.error(
        `대상을 지정하세요: npm run crawl:slots -- <${[...supported, "all"].join(" | ")}> [일수]`
      );
      process.exitCode = 1;
      return;
    }
    if (!Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
      logger.error(`일수는 1~${MAX_DAYS} 사이 정수여야 합니다: ${daysArg}`);
      process.exitCode = 1;
      return;
    }

    const keys = target === "all" ? supported : [target];
    for (const key of keys) {
      const source = await crawler.findSource(key);
      logger.log(`[${key}] 빈자리 수집 시작 (${days}일)`);
      const stats = await crawler.crawl(source, days);
      logger.log(`[${key}] 완료 ${JSON.stringify(stats)}`);
    }
  } catch (error) {
    logger.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await app.close();
  }
}
void main();
