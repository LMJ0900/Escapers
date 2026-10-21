import type { CrawlRunStatus } from "../../generated/prisma/client";
import type { PrismaService } from "../../infra/prisma/prisma.service";
import { CrawlBlockedError } from "./crawler.error";

// 테마 · 슬롯 수집이 함께 쓰는 CrawlRun 기록 · 검증 헬퍼 (백엔드 명세서 §6.5 7번)

/** 성공(SUCCESS · PARTIAL): 소스 연속 실패 수를 초기화한다 */
export async function completeCrawlRun(
  prisma: PrismaService,
  runId: string,
  sourceId: string,
  status: Extract<CrawlRunStatus, "SUCCESS" | "PARTIAL">,
  stats: object
): Promise<void> {
  await prisma.$transaction([
    prisma.crawlRun.update({
      where: { id: runId },
      data: { status, finishedAt: new Date(), stats: { ...stats } },
    }),
    prisma.source.update({
      where: { id: sourceId },
      data: { lastSuccessAt: new Date(), consecutiveFailures: 0 },
    }),
  ]);
}

/** 실패: 연속 실패 수를 늘리고, 차단 응답이면 소스를 멈춘다. 소스를 멈췄으면 true */
export async function failCrawlRun(
  prisma: PrismaService,
  runId: string,
  sourceId: string,
  error: unknown
): Promise<boolean> {
  const blocked = error instanceof CrawlBlockedError;
  await prisma.$transaction([
    prisma.crawlRun.update({
      where: { id: runId },
      data: {
        status: "FAILED",
        finishedAt: new Date(),
        error: error instanceof Error ? error.message : String(error),
      },
    }),
    prisma.source.update({
      where: { id: sourceId },
      data: {
        consecutiveFailures: { increment: 1 },
        // 차단 응답이면 우회하지 않고 소스를 멈춘다 (§6.3)
        ...(blocked && { enabled: false }),
      },
    }),
  ]);
  return blocked;
}

export function validateAll<T>(
  items: unknown[],
  schema: {
    safeParse(value: unknown): { success: true; data: T } | { success: false };
  }
): { valid: T[]; invalid: number } {
  const valid: T[] = [];
  let invalid = 0;
  for (const item of items) {
    const result = schema.safeParse(item);
    if (result.success) valid.push(result.data);
    else invalid++;
  }
  return { valid, invalid };
}
