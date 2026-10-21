import { z } from "zod";
import type { PoliteFetcher } from "../http/polite-fetcher";

// 어댑터 출력 스키마 (백엔드 명세서 §6.1). 사이트와 무관하게 이 형태로 맞춘다.
// 정규화(장르 enum 매핑 등)는 어댑터가 아니라 theme.normalizer 가 맡는다.

export const CrawledBranchSchema = z.object({
  /** 사이트가 쓰는 지점 식별자 */
  externalId: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
});
export type CrawledBranch = z.infer<typeof CrawledBranchSchema>;

export const CrawledThemeSchema = z.object({
  /** 사이트가 부여한 테마 ID. upsert 키로 쓴다 */
  externalId: z.string().min(1),
  /** CrawledBranch.externalId 와 매칭 */
  branchExternalId: z.string().min(1),
  name: z.string().min(1),
  genreRaw: z.string().optional(),
  difficultyRaw: z.string().optional(),
  playersRaw: z.string().optional(),
  playTimeRaw: z.string().optional(),
  priceRaw: z.string().optional(),
  description: z.string().optional(),
  imageUrl: z.url().optional(),
  detailUrl: z.url(),
});
export type CrawledTheme = z.infer<typeof CrawledThemeSchema>;

export interface CrawledThemesResult {
  branches: CrawledBranch[];
  themes: CrawledTheme[];
}

export const CrawledSlotSchema = z.object({
  /** CrawledTheme.externalId 와 매칭 */
  themeExternalId: z.string().min(1),
  /** 한국 시간 "YYYY-MM-DD" */
  date: z.iso.date(),
  /** 한국 시간 "HH:mm" */
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  available: z.boolean(),
  priceRaw: z.string().optional(),
});
export type CrawledSlot = z.infer<typeof CrawledSlotSchema>;

export interface CrawledSlotsResult {
  slots: CrawledSlot[];
}

/** 슬롯을 조회할 테마. DB 의 Theme 에서 어댑터가 필요한 값만 넘긴다 */
export interface SlotTargetTheme {
  externalId: string;
  branchExternalId: string;
  name: string;
}

export interface CrawlerAdapterContext {
  baseUrl: string;
  fetcher: PoliteFetcher;
}

export interface CrawlerAdapter {
  /** Source.adapterKey 와 매칭 */
  readonly key: string;
  readonly engine: "CHEERIO" | "PLAYWRIGHT";
  /** 소스 최초 등록 시 쓰는 기본값 */
  readonly defaults: { brandName: string; baseUrl: string };

  /** 테마 메타데이터 수집 (최초 1회 · 변경 감지 시 · 주 1회 보정 — §7.3) */
  fetchThemes(ctx: CrawlerAdapterContext): Promise<CrawledThemesResult>;

  /**
   * 테마 · 날짜별 예약 시간 상태 수집 (§7.2). 지금은 CLI(src/crawl-slots.ts)에서 수동 실행한다.
   * 예약 화면을 정책상 읽을 수 없는 소스(robots.txt 금지 등)는 구현하지 않는다.
   */
  fetchSlots?(
    ctx: CrawlerAdapterContext,
    themes: SlotTargetTheme[],
    dates: string[]
  ): Promise<CrawledSlotsResult>;
}
