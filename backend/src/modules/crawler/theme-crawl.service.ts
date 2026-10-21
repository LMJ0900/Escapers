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
import { completeCrawlRun, failCrawlRun, validateAll } from "./crawl-run";
import { CrawlParseError } from "./crawler.error";
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

/**
 * 변경 여부를 비교할 테마 필드. save() 의 data 와 키를 맞춘다.
 * 여기에 빠진 키는 항상 "변경됨"으로 판단되므로 누락돼도 갱신이 빠지지는 않는다.
 */
const THEME_COMPARE_SELECT = {
  branchId: true,
  name: true,
  genre: true,
  genreRaw: true,
  difficulty: true,
  priceFrom: true,
  minPlayers: true,
  maxPlayers: true,
  playTimeMin: true,
  description: true,
  imageUrl: true,
  detailUrl: true,
  status: true,
} as const;

export interface ThemeCrawlStats {
  branches: number;
  created: number;
  /** 필드 값이 실제로 바뀐 테마 */
  updated: number;
  /** 다시 확인됐지만 바뀐 필드가 없는 테마 */
  unchanged: number;
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

      await completeCrawlRun(this.prisma, run.id, source.id, status, stats);
      return stats;
    } catch (error) {
      const blocked = await failCrawlRun(
        this.prisma,
        run.id,
        source.id,
        error
      );
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
    crawledThemes: CrawledTheme[],
    { closeMissing }: { closeMissing: boolean }
  ): Promise<ThemeCrawlStats> {
    const now = new Date();
    const themes = dedupeByExternalId(crawledThemes);
    if (themes.length < crawledThemes.length) {
      this.logger.warn(
        `중복된 테마 ID ${crawledThemes.length - themes.length}건은 첫 번째 항목만 저장합니다: ${source.adapterKey}`
      );
    }
    const stats: ThemeCrawlStats = {
      branches: branches.length,
      created: 0,
      updated: 0,
      unchanged: 0,
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

        // 기존 테마를 한 번에 읽어 두고 테마마다 findUnique 하지 않는다
        const existingThemes = await tx.theme.findMany({
          where: {
            sourceId: source.id,
            externalId: { in: themes.map((t) => t.externalId) },
          },
          select: { id: true, externalId: true, ...THEME_COMPARE_SELECT },
        });
        const existingByExternalId = new Map(
          existingThemes.map((t) => [t.externalId, t])
        );
        const unchangedIds: string[] = [];

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
          };
          const existing = existingByExternalId.get(theme.externalId);
          if (!existing) {
            await tx.theme.create({
              data: {
                ...data,
                sourceId: source.id,
                externalId: theme.externalId,
                lastSeenAt: now,
              },
            });
            stats.created++;
          } else if (hasChanges(existing, data)) {
            await tx.theme.update({
              where: { id: existing.id },
              data: { ...data, lastSeenAt: now },
            });
            stats.updated++;
          } else {
            unchangedIds.push(existing.id);
            stats.unchanged++;
          }
        }

        if (unchangedIds.length > 0) {
          // Prisma update 는 @updatedAt 을 함께 바꾸므로, 바뀐 게 없는 테마는
          // lastSeenAt 만 직접 갱신해 updatedAt 이 "실제 변경 시각"으로 남게 한다.
          // 컬럼이 TIMESTAMP(타임존 없음)라 Prisma 처럼 UTC 로 맞춰 넣는다 (DB 세션 타임존과 무관하게)
          await tx.$executeRaw`UPDATE "Theme" SET "lastSeenAt" = (${now.toISOString()}::timestamptz AT TIME ZONE 'UTC') WHERE "id" = ANY(${unchangedIds}::text[])`;
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

/**
 * 같은 테마가 여러 지점 목록에 실려 오면 첫 번째만 남긴다.
 * 기존 테마를 미리 읽어 두고 비교하므로, 중복이 남아 있으면 같은 테마를 두 번 create 하다 유니크 제약에 걸린다.
 */
function dedupeByExternalId(themes: CrawledTheme[]): CrawledTheme[] {
  const seen = new Map<string, CrawledTheme>();
  for (const theme of themes) {
    if (!seen.has(theme.externalId)) seen.set(theme.externalId, theme);
  }
  return [...seen.values()];
}

/** data 의 필드 중 하나라도 기존 값과 다르면 true */
function hasChanges(
  existing: Record<string, unknown>,
  data: Record<string, unknown>
): boolean {
  return Object.entries(data).some(([key, value]) => existing[key] !== value);
}
