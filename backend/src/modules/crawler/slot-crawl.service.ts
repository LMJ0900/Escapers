import { Injectable, Logger } from "@nestjs/common";
import type { Source } from "../../generated/prisma/client";
import { PrismaService } from "../../infra/prisma/prisma.service";
import { AdapterRegistry } from "./adapters/adapter.registry";
import {
  CrawledSlotSchema,
  type CrawledSlot,
  type SlotTargetTheme,
} from "./adapters/crawler.adapter";
import { completeCrawlRun, failCrawlRun, validateAll } from "./crawl-run";
import { CrawlParseError } from "./crawler.error";
import { PoliteFetcher } from "./http/polite-fetcher";
import { seoulDates, toSlotStartsAt } from "./normalize/slot.normalizer";
import { normalizePriceFrom } from "./normalize/theme.normalizer";

/** 검증 실패 비율이 이보다 높으면 사이트 구조 변경으로 보고 저장하지 않는다 */
const MAX_INVALID_RATIO = 0.3;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface SlotCrawlStats {
  themes: number;
  dates: number;
  /** 처음 보는 시간 */
  created: number;
  /** 마감 → 예약 가능 (빈자리 생김) */
  opened: number;
  /** 예약 가능 → 마감 */
  closed: number;
  unchanged: number;
  /** 전에는 있었는데 이번에 보이지 않아 마감으로 바꾼 시간 */
  missing: number;
  invalid: number;
  /** DB 에 없는 테마의 슬롯. 테마를 다시 수집해야 한다는 신호 */
  unknownThemes: number;
}

type TargetTheme = SlotTargetTheme & { id: string };

interface SeenSlot {
  themeId: string;
  startsAt: Date;
  available: boolean;
  price: number | null;
  /** 로그용 "테마명 YYYY-MM-DD HH:mm" */
  label: string;
}

/**
 * 빈자리(슬롯) 수집 · 저장 (백엔드 명세서 §7.2).
 * 지금은 CLI(src/crawl-slots.ts)에서 수동 실행하고, 자동 감시 도입 시 워커의 crawl:slots 프로세서가 호출한다.
 */
@Injectable()
export class SlotCrawlService {
  private readonly logger = new Logger(SlotCrawlService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: AdapterRegistry,
    private readonly fetcher: PoliteFetcher
  ) {}

  /** 어댑터가 빈자리 수집(fetchSlots)을 구현했는지 */
  supports(adapterKey: string): boolean {
    return Boolean(this.registry.get(adapterKey).fetchSlots);
  }

  /** 슬롯은 수집된 테마에 붙으므로, 소스가 없으면 테마부터 수집하라고 알린다 */
  async findSource(adapterKey: string): Promise<Source> {
    const source = await this.prisma.source.findUnique({
      where: { adapterKey },
    });
    if (!source) {
      throw new Error(
        `등록되지 않은 소스입니다. 테마를 먼저 수집하세요: npm run crawl -- ${adapterKey}`
      );
    }
    return source;
  }

  /** 한국 시간 기준 오늘부터 days 일치, 소스의 OPEN 테마 전체를 수집한다 */
  async crawl(source: Source, days: number): Promise<SlotCrawlStats> {
    if (!source.enabled) {
      throw new Error(`비활성화된 소스입니다: ${source.adapterKey}`);
    }
    const adapter = this.registry.get(source.adapterKey);
    if (!adapter.fetchSlots) {
      throw new Error(`빈자리 수집을 지원하지 않는 소스입니다: ${source.adapterKey}`);
    }

    const themes = await this.findTargetThemes(source.id);
    if (themes.length === 0) {
      throw new Error(
        `수집된 테마가 없습니다. 테마를 먼저 수집하세요: npm run crawl -- ${source.adapterKey}`
      );
    }
    const dates = seoulDates(new Date(), days);

    const run = await this.prisma.crawlRun.create({
      data: { sourceId: source.id, kind: "slots" },
    });

    try {
      const raw = await adapter.fetchSlots(
        { baseUrl: source.baseUrl, fetcher: this.fetcher },
        themes,
        dates
      );

      const { valid, invalid } = validateAll(raw.slots, CrawledSlotSchema);
      if (valid.length === 0 || invalid / raw.slots.length > MAX_INVALID_RATIO) {
        throw new CrawlParseError(
          `파싱 결과가 비정상입니다 (유효 슬롯 ${valid.length}개, 실패 ${invalid}/${raw.slots.length}). 사이트 구조가 바뀌었을 수 있습니다.`
        );
      }

      const stats = await this.save(themes, dates, valid, {
        // 일부라도 검증에 실패했으면 "안 보인 시간"을 판단할 수 없으므로 마감 처리하지 않는다
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

  /** 사이트 ID(테마 · 지점 externalId)가 있는 OPEN 테마만 조회할 수 있다 */
  private async findTargetThemes(sourceId: string): Promise<TargetTheme[]> {
    const themes = await this.prisma.theme.findMany({
      where: { sourceId, status: "OPEN" },
      select: {
        id: true,
        name: true,
        externalId: true,
        branch: { select: { externalId: true } },
      },
      orderBy: { name: "asc" },
    });
    return themes.flatMap(({ id, name, externalId, branch }) =>
      externalId && branch.externalId
        ? [{ id, name, externalId, branchExternalId: branch.externalId }]
        : []
    );
  }

  private async save(
    themes: TargetTheme[],
    dates: string[],
    slots: CrawledSlot[],
    { closeMissing }: { closeMissing: boolean }
  ): Promise<SlotCrawlStats> {
    const now = new Date();
    const stats: SlotCrawlStats = {
      themes: themes.length,
      dates: dates.length,
      created: 0,
      opened: 0,
      closed: 0,
      unchanged: 0,
      missing: 0,
      invalid: 0,
      unknownThemes: 0,
    };

    const themeByExternalId = new Map(themes.map((t) => [t.externalId, t]));
    const unknownThemes = new Set<string>();
    // 같은 시간이 두 번 오면 첫 번째만 쓴다
    const seen = new Map<string, SeenSlot>();
    for (const slot of slots) {
      const theme = themeByExternalId.get(slot.themeExternalId);
      if (!theme) {
        unknownThemes.add(slot.themeExternalId);
        continue;
      }
      const startsAt = toSlotStartsAt(slot.date, slot.time);
      const key = slotKey(theme.id, startsAt);
      if (seen.has(key)) continue;
      seen.set(key, {
        themeId: theme.id,
        startsAt,
        available: slot.available,
        price: normalizePriceFrom(slot.priceRaw),
        label: `${theme.name} ${slot.date} ${slot.time}`,
      });
    }
    stats.unknownThemes = unknownThemes.size;
    if (unknownThemes.size > 0) {
      this.logger.warn(
        `DB 에 없는 테마 ${unknownThemes.size}개의 슬롯은 저장하지 않습니다. 테마를 다시 수집하세요: ${[...unknownThemes].join(", ")}`
      );
    }

    const opened: string[] = [];
    await this.prisma.$transaction(
      async (tx) => {
        const existing = await tx.slot.findMany({
          where: {
            themeId: { in: themes.map((t) => t.id) },
            startsAt: {
              gte: toSlotStartsAt(dates[0], "00:00"),
              lt: new Date(
                toSlotStartsAt(dates[dates.length - 1], "00:00").getTime() +
                  DAY_MS
              ),
            },
          },
          select: {
            id: true,
            themeId: true,
            startsAt: true,
            available: true,
            price: true,
          },
        });

        // available · price 조합별로 묶어 updateMany 한 번에 바꾼다
        const changes = new Map<
          string,
          { available: boolean; price: number | null; ids: string[] }
        >();
        const unchangedIds: string[] = [];
        const missingIds: string[] = [];

        for (const slot of existing) {
          const crawled = seen.get(slotKey(slot.themeId, slot.startsAt));
          if (!crawled) {
            if (slot.available) missingIds.push(slot.id);
            continue;
          }
          seen.delete(slotKey(slot.themeId, slot.startsAt));

          if (
            slot.available === crawled.available &&
            slot.price === crawled.price
          ) {
            unchangedIds.push(slot.id);
            stats.unchanged++;
            continue;
          }
          if (!slot.available && crawled.available) {
            stats.opened++;
            opened.push(crawled.label);
          } else if (slot.available && !crawled.available) {
            stats.closed++;
          } else {
            // 가격만 바뀜
            stats.unchanged++;
          }
          const changeKey = `${crawled.available}:${crawled.price}`;
          const change = changes.get(changeKey) ?? {
            available: crawled.available,
            price: crawled.price,
            ids: [],
          };
          change.ids.push(slot.id);
          changes.set(changeKey, change);
        }

        // 기존에 없던 시간만 seen 에 남아 있다
        const created = [...seen.values()];
        if (created.length > 0) {
          await tx.slot.createMany({
            data: created.map(({ themeId, startsAt, available, price }) => ({
              themeId,
              startsAt,
              available,
              price,
              lastSeenAt: now,
            })),
          });
          stats.created = created.length;
        }

        for (const { available, price, ids } of changes.values()) {
          await tx.slot.updateMany({
            where: { id: { in: ids } },
            data: { available, price, lastSeenAt: now },
          });
        }
        if (unchangedIds.length > 0) {
          await tx.slot.updateMany({
            where: { id: { in: unchangedIds } },
            data: { lastSeenAt: now },
          });
        }
        if (closeMissing && missingIds.length > 0) {
          // 사이트에서 사라진 시간(운영 시간 변경 · 예약 기간 밖 등)은 예약할 수 없는 것으로 본다
          await tx.slot.updateMany({
            where: { id: { in: missingIds } },
            data: { available: false },
          });
          stats.missing = missingIds.length;
        }
      },
      { timeout: 60_000 }
    );

    for (const label of opened) {
      this.logger.log(`빈자리가 생겼습니다: ${label}`);
    }
    return stats;
  }
}

function slotKey(themeId: string, startsAt: Date): string {
  return `${themeId}|${startsAt.toISOString()}`;
}
