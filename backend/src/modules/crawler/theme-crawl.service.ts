import { Injectable, Logger } from "@nestjs/common";
import type { Source } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdapterRegistry } from "./adapters/adapter.registry";
import {
  CrawledBranchSchema,
  CrawledThemeSchema,
  type CrawledBranch,
  type CrawledTheme,
} from "./adapters/crawler.adapter";
import { CrawlBlockedError, CrawlParseError } from "./crawler.error";
import { PoliteFetcher } from "./http/polite-fetcher";
import {
  normalizeDifficulty,
  normalizeGenre,
  normalizePlayers,
  normalizePlayTime,
  normalizePriceFrom,
  normalizeRegion,
} from "./normalize/theme.normalizer";

/** crawl:themes 실행 사유 (백엔드 명세서 §7.3) */
export type ThemeCrawlReason =
  "INITIAL" | "CHANGE_DETECTED" | "WEEKLY" | "MANUAL";

/** 검증 실패 비율이 이보다 높으면 사이트 구조 변경으로 보고 저장하지 않는다 */
const MAX_INVALID_RATIO = 0.3;

export interface ThemeCrawlStats {
  branches: number;
  created: number;
  updated: number;
  closed: number;
  invalid: number;
}

@Injectable()
export class ThemeCrawlService {
  private readonly logger = new Logger(ThemeCrawlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AdapterRegistry,
    private readonly fetcher: PoliteFetcher
  ) {}

  /** 소스가 없으면 어댑터 기본값으로 Brand · Source 를 만든다 (소스 최초 등록) */
  async ensureSource(adapterKey: string): Promise<Source> {
    const existing = await this.prisma.source.findUnique({
      where: { adapterKey },
    });
    if (existing) return existing;

    const adapter = this.registry.get(adapterKey);
    const brand = await this.prisma.brand.upsert({
      where: { name: adapter.defaults.brandName },
      create: { name: adapter.defaults.brandName },
      update: {},
    });
    this.logger.log(`소스를 등록합니다: ${adapterKey}`);
    return this.prisma.source.create({
      data: {
        brandId: brand.id,
        adapterKey,
        baseUrl: adapter.defaults.baseUrl,
        engine: adapter.engine,
      },
    });
  }

  async crawl(
    source: Source,
    reason: ThemeCrawlReason
  ): Promise<ThemeCrawlStats> {
    if (!source.enabled) {
      throw new Error(`비활성화된 소스입니다: ${source.adapterKey}`);
    }
    const run = await this.prisma.crawlRun.create({
      data: { sourceId: source.id, kind: "themes", reason },
    });

    try {
      const adapter = this.registry.get(source.adapterKey);
      const raw = await adapter.fetchThemes({
        baseUrl: source.baseUrl,
        fetcher: this.fetcher,
      });

      const branches = validateAll(raw.branches, CrawledBranchSchema);
      const themes = validateAll(raw.themes, CrawledThemeSchema);
      const invalid = branches.invalid + themes.invalid;
      const total = raw.branches.length + raw.themes.length;
      if (themes.valid.length === 0 || invalid / total > MAX_INVALID_RATIO) {
        throw new CrawlParseError(
          `파싱 결과가 비정상입니다 (유효 테마 ${themes.valid.length}개, 실패 ${invalid}/${total}). 사이트 구조가 바뀌었을 수 있습니다.`
        );
      }

      const stats = await this.save(source, branches.valid, themes.valid, {
        // 일부라도 검증에 실패했으면 "안 보인 테마"를 판단할 수 없으므로 종료 처리하지 않는다
        closeMissing: invalid === 0,
      });
      stats.invalid = invalid;
      const status = invalid === 0 ? "SUCCESS" : "PARTIAL";

      await this.prisma.$transaction([
        this.prisma.crawlRun.update({
          where: { id: run.id },
          data: { status, finishedAt: new Date(), stats: { ...stats } },
        }),
        this.prisma.source.update({
          where: { id: source.id },
          data: { lastSuccessAt: new Date(), consecutiveFailures: 0 },
        }),
      ]);
      return stats;
    } catch (error) {
      const blocked = error instanceof CrawlBlockedError;
      await this.prisma.$transaction([
        this.prisma.crawlRun.update({
          where: { id: run.id },
          data: {
            status: "FAILED",
            finishedAt: new Date(),
            error: error instanceof Error ? error.message : String(error),
          },
        }),
        this.prisma.source.update({
          where: { id: source.id },
          data: {
            consecutiveFailures: { increment: 1 },
            // 차단 응답이면 우회하지 않고 소스를 멈춘다 (§6.3)
            ...(blocked && { enabled: false }),
          },
        }),
      ]);
      if (blocked) {
        this.logger.error(
          `차단 응답으로 소스를 비활성화했습니다: ${source.adapterKey}`
        );
      }
      throw error;
    }
  }

  private async save(
    source: Source,
    branches: CrawledBranch[],
    themes: CrawledTheme[],
    { closeMissing }: { closeMissing: boolean }
  ): Promise<ThemeCrawlStats> {
    const now = new Date();
    const stats: ThemeCrawlStats = {
      branches: branches.length,
      created: 0,
      updated: 0,
      closed: 0,
      invalid: 0,
    };

    await this.prisma.$transaction(
      async (tx) => {
        const branchIds = new Map<string, string>();
        for (const branch of branches) {
          const data = {
            externalId: branch.externalId,
            region: normalizeRegion(branch.address),
            address: branch.address,
            lat: branch.lat ?? null,
            lng: branch.lng ?? null,
            phone: branch.phone ?? null,
          };
          const saved = await tx.branch.upsert({
            where: {
              brandId_name: { brandId: source.brandId, name: branch.name },
            },
            create: { brandId: source.brandId, name: branch.name, ...data },
            update: data,
          });
          branchIds.set(branch.externalId, saved.id);
        }

        for (const theme of themes) {
          const branchId = branchIds.get(theme.branchExternalId);
          if (!branchId) {
            stats.invalid++;
            continue;
          }
          const data = {
            branchId,
            name: theme.name,
            genre: normalizeGenre(theme.genreRaw),
            genreRaw: theme.genreRaw ?? null,
            difficulty: normalizeDifficulty(theme.difficultyRaw),
            priceFrom: normalizePriceFrom(theme.priceRaw),
            ...normalizePlayers(theme.playersRaw),
            playTimeMin: normalizePlayTime(theme.playTimeRaw),
            description: theme.description ?? null,
            imageUrl: theme.imageUrl ?? null,
            detailUrl: theme.detailUrl,
            // 종료됐다가 다시 나타난 테마는 재오픈한다
            status: "OPEN" as const,
            lastSeenAt: now,
          };
          const existing = await tx.theme.findUnique({
            where: {
              sourceId_externalId: {
                sourceId: source.id,
                externalId: theme.externalId,
              },
            },
            select: { id: true },
          });
          if (existing) {
            await tx.theme.update({ where: { id: existing.id }, data });
            stats.updated++;
          } else {
            await tx.theme.create({
              data: {
                ...data,
                sourceId: source.id,
                externalId: theme.externalId,
              },
            });
            stats.created++;
          }
        }

        if (closeMissing) {
          const closed = await tx.theme.updateMany({
            where: {
              sourceId: source.id,
              status: "OPEN",
              externalId: { notIn: themes.map((t) => t.externalId) },
            },
            data: { status: "CLOSED" },
          });
          stats.closed = closed.count;
        }
      },
      { timeout: 60_000 }
    );
    return stats;
  }
}

function validateAll<T>(
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
