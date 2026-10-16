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

  // fetchSlots 는 빈자리 감시(§7.2) 구현 시 추가한다.
}
