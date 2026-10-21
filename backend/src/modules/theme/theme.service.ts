import { Injectable } from "@nestjs/common";
import { AppException } from "../../common/exception/app.exception";
import { PrismaService } from "../../infra/prisma/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import {
  encodeThemeCursor,
  themeAfterCursor,
  themeOrderBy,
} from "./theme.cursor";
import {
  encodeReviewCursor,
  reviewAfterCursor,
  reviewOrderBy,
} from "./review.cursor";
import { THEME_ERROR } from "./theme.error";
import { ACTIVITY_LABEL, GENRE_LABEL } from "./theme.label";
import {
  THEME_COLLECTION_TYPES,
  type GetThemeReviewsQuery,
  type GetThemeReviewsResponse,
  type GetThemeSlotsResponse,
  type GetThemesQuery,
  type GetThemesResponse,
  type PutThemeLikeRequest,
  type PutThemeLikeResponse,
  type ThemeCollectionType,
  type ThemeDetail,
  type ThemeFacetOption,
  type ThemeFacets,
  type ThemeListItem,
  type ThemeReviewSummary,
  type ThemeSlotDay,
} from "./theme.schema";

/** 홈 캐러셀 묶음 하나에 보여주는 테마 수 */
const COLLECTION_SIZE = 10;

const THEME_LIST_SELECT = {
  id: true,
  name: true,
  genre: true,
  difficulty: true,
  priceFrom: true,
  activityLevel: true,
  imageUrl: true,
  // 커서 인코딩용 정렬 키
  popularityScore: true,
  createdAt: true,
  branch: {
    select: { name: true, region: true, brand: { select: { name: true } } },
  },
} as const satisfies Prisma.ThemeSelect;

type ThemeListRow = Prisma.ThemeGetPayload<{
  select: typeof THEME_LIST_SELECT;
}>;

const THEME_DETAIL_SELECT = {
  ...THEME_LIST_SELECT,
  minPlayers: true,
  maxPlayers: true,
  playTimeMin: true,
  description: true,
  detailUrl: true,
  branch: {
    select: {
      ...THEME_LIST_SELECT.branch.select,
      address: true,
      lat: true,
      lng: true,
      phone: true,
    },
  },
  _count: { select: { likes: true } },
} as const satisfies Prisma.ThemeSelect;

const REVIEW_SELECT = {
  id: true,
  rating: true,
  cleared: true,
  remainingSeconds: true,
  hintCount: true,
  playerCount: true,
  content: true,
  photoUrls: true,
  helpfulCount: true,
  createdAt: true,
  user: { select: { nickname: true } },
} as const satisfies Prisma.ReviewSelect;

/** 예약 가능 시간을 보여주는 기간(오늘 포함) */
const SLOT_DAYS = 7;

/** 한국 시간(UTC+9, 서머타임 없음) */
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** 컬렉션 정의 (백엔드 명세서 §4.3). 모두 인기순이고 rank 는 hot 에서만 채운다. */
const COLLECTION_WHERE: Record<ThemeCollectionType, Prisma.ThemeWhereInput> = {
  hot: {},
  horror: { genre: "HORROR" },
  active: { activityLevel: "HIGH" },
};

// 종료(CLOSED)된 테마는 목록 · 컬렉션 · facets 에 노출하지 않는다.
const LISTED: Prisma.ThemeWhereInput = { status: "OPEN" };

@Injectable()
export class ThemeService {
  constructor(private readonly prisma: PrismaService) {}

  async getThemes(
    query: GetThemesQuery,
    userId: string | undefined
  ): Promise<GetThemesResponse> {
    const filtered: Prisma.ThemeWhereInput = {
      ...LISTED,
      ...(query.genres && { genre: { in: query.genres } }),
      ...(query.activityLevels && {
        activityLevel: { in: query.activityLevels },
      }),
      branch: {
        ...(query.regions && { region: { in: query.regions } }),
        ...(query.brands && { brand: { name: { in: query.brands } } }),
      },
    };

    const [rows, totalCount, facets] = await Promise.all([
      this.prisma.theme.findMany({
        where: query.cursor
          ? { AND: [filtered, themeAfterCursor(query.sort, query.cursor)] }
          : filtered,
        orderBy: themeOrderBy(query.sort),
        // 한 건 더 읽어 다음 페이지가 있는지 본다
        take: query.size + 1,
        select: THEME_LIST_SELECT,
      }),
      this.prisma.theme.count({ where: filtered }),
      this.getFacets(),
    ]);

    const page = rows.slice(0, query.size);
    const last = page.at(-1);
    const nextCursor =
      rows.length > query.size && last
        ? encodeThemeCursor(query.sort, last)
        : null;

    return {
      items: await this.toListItems(page, userId),
      nextCursor,
      totalCount,
      facets,
    };
  }

  async getCollection(
    type: string,
    userId: string | undefined
  ): Promise<ThemeListItem[]> {
    if (!isCollectionType(type)) {
      throw new AppException(THEME_ERROR.COLLECTION_NOT_FOUND);
    }

    const rows = await this.prisma.theme.findMany({
      where: { ...LISTED, ...COLLECTION_WHERE[type] },
      orderBy: themeOrderBy("POPULAR"),
      take: COLLECTION_SIZE,
      select: THEME_LIST_SELECT,
    });

    const items = await this.toListItems(rows, userId);
    return type === "hot"
      ? items.map((item, index) => ({ ...item, rank: index + 1 }))
      : items;
  }

  /** 종료(CLOSED)된 테마도 좋아요 목록 등에서 들어올 수 있어 상세는 그대로 보여준다. */
  async getThemeDetail(
    themeId: string,
    userId: string | undefined
  ): Promise<ThemeDetail> {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      select: THEME_DETAIL_SELECT,
    });
    if (!theme) throw new AppException(THEME_ERROR.NOT_FOUND);

    const [[item], summary] = await Promise.all([
      this.toListItems([theme], userId),
      this.getReviewSummary(themeId),
    ]);
    const { branch } = theme;

    return {
      ...item,
      likeCount: theme._count.likes,
      minPlayers: theme.minPlayers,
      maxPlayers: theme.maxPlayers,
      playMinutes: theme.playTimeMin,
      description: theme.description,
      ratingAvg: summary.ratingAvg,
      reviewCount: summary.reviewCount,
      branch: {
        // 크롤링한 지점 이름에 브랜드가 이미 붙어 있는 소스가 있다 (예: "넥스트에디션 건대1호점").
        name: branch.name.startsWith(branch.brand.name)
          ? branch.name
          : `${branch.brand.name} ${branch.name}`,
        address: branch.address || null,
        latitude: branch.lat,
        longitude: branch.lng,
        // 크롤링 소스에 없는 항목. 수집하게 되면 Branch 에 추가한다.
        transit: null,
        phone: branch.phone,
        openingHours: null,
        // 지점 예약 페이지를 따로 수집하지 않아 테마의 원본 예약 · 상세 페이지를 쓴다.
        bookingUrl: theme.detailUrl,
      },
    };
  }

  /**
   * 한국 시간 기준 오늘부터 SLOT_DAYS 일치. 슬롯이 없는 날도 빈 배열로 내려준다.
   * 이미 지난 시간은 예약할 수 없으므로 available 을 false 로 내린다.
   */
  async getThemeSlots(themeId: string): Promise<GetThemeSlotsResponse> {
    await this.assertThemeExists(themeId);

    const now = new Date();
    const today = toSeoulDate(now);
    const days = new Map<string, ThemeSlotDay>(
      Array.from({ length: SLOT_DAYS }, (_, offset) => {
        const date = addDays(today, offset);
        return [date, { date, slots: [] }];
      })
    );

    const rows = await this.prisma.slot.findMany({
      where: {
        themeId,
        startsAt: {
          gte: seoulMidnight(today),
          lt: seoulMidnight(addDays(today, SLOT_DAYS)),
        },
      },
      orderBy: { startsAt: "asc" },
      select: { startsAt: true, available: true },
    });

    for (const row of rows) {
      days.get(toSeoulDate(row.startsAt))?.slots.push({
        time: toSeoulTime(row.startsAt),
        available: row.available && row.startsAt > now,
      });
    }

    return { days: [...days.values()] };
  }

  async getThemeReviews(
    themeId: string,
    query: GetThemeReviewsQuery,
    userId: string | undefined
  ): Promise<GetThemeReviewsResponse> {
    await this.assertThemeExists(themeId);

    const filtered: Prisma.ReviewWhereInput = {
      themeId,
      status: "PUBLISHED",
      ...(query.photoOnly && { photoUrls: { isEmpty: false } }),
    };

    const [rows, summary] = await Promise.all([
      this.prisma.review.findMany({
        where: query.cursor
          ? { AND: [filtered, reviewAfterCursor(query.sort, query.cursor)] }
          : filtered,
        orderBy: reviewOrderBy(query.sort),
        // 한 건 더 읽어 다음 페이지가 있는지 본다
        take: query.size + 1,
        select: REVIEW_SELECT,
      }),
      this.getReviewSummary(themeId),
    ]);

    const page = rows.slice(0, query.size);
    const last = page.at(-1);
    const nextCursor =
      rows.length > query.size && last
        ? encodeReviewCursor(query.sort, last)
        : null;

    const helpedIds = new Set<string>();
    if (userId && page.length > 0) {
      const helpfuls = await this.prisma.reviewHelpful.findMany({
        where: { userId, reviewId: { in: page.map((row) => row.id) } },
        select: { reviewId: true },
      });
      for (const helpful of helpfuls) helpedIds.add(helpful.reviewId);
    }

    return {
      items: page.map((row) => ({
        id: row.id,
        nickname: row.user.nickname,
        rating: row.rating,
        writtenAt: toSeoulDate(row.createdAt),
        playerCount: row.playerCount,
        cleared: row.cleared,
        remainingSeconds: row.remainingSeconds,
        hintCount: row.hintCount,
        content: row.content,
        photoUrls: row.photoUrls,
        helpfulCount: row.helpfulCount,
        helped: helpedIds.has(row.id),
      })),
      nextCursor,
      summary,
    };
  }

  /** 목표 상태(liked)를 반영하는 멱등 연산 — 연타해도 최종 상태만 남는다 (백엔드 명세서 §4.3). */
  async putLike(
    userId: string,
    themeId: string,
    body: PutThemeLikeRequest
  ): Promise<PutThemeLikeResponse> {
    await this.assertThemeExists(themeId);

    if (body.liked) {
      // 동시에 들어온 같은 요청끼리 PK 충돌이 나지 않도록 upsert 대신 skipDuplicates 를 쓴다.
      await this.prisma.themeLike.createMany({
        data: [{ userId, themeId }],
        skipDuplicates: true,
      });
    } else {
      await this.prisma.themeLike.deleteMany({ where: { userId, themeId } });
    }

    return { liked: body.liked };
  }

  /**
   * 현재 필터를 적용하기 전, 노출 중인 전체 테마 기준 옵션별 개수 (백엔드 명세서 §4.3).
   * TODO: Redis 도입 후 5분 캐시 (§9.1)
   */
  private async getFacets(): Promise<ThemeFacets> {
    const [byBranch, byGenre, byActivity] = await Promise.all([
      this.prisma.theme.groupBy({
        by: ["branchId"],
        where: LISTED,
        _count: { _all: true },
      }),
      this.prisma.theme.groupBy({
        by: ["genre"],
        where: LISTED,
        _count: { _all: true },
      }),
      this.prisma.theme.groupBy({
        by: ["activityLevel"],
        where: { ...LISTED, activityLevel: { not: null } },
        _count: { _all: true },
      }),
    ]);

    const branches = await this.prisma.branch.findMany({
      where: { id: { in: byBranch.map((group) => group.branchId) } },
      select: { id: true, region: true, brand: { select: { name: true } } },
    });
    const branchById = new Map(branches.map((branch) => [branch.id, branch]));

    const brandCounts = new Map<string, number>();
    const regionCounts = new Map<string, number>();
    for (const group of byBranch) {
      const branch = branchById.get(group.branchId);
      if (!branch) continue;
      increment(brandCounts, branch.brand.name, group._count._all);
      increment(regionCounts, branch.region, group._count._all);
    }

    const genreCounts = new Map(
      byGenre.map((group) => [group.genre, group._count._all])
    );
    const activityCounts = new Map(
      byActivity.map((group) => [group.activityLevel, group._count._all])
    );

    return {
      brands: byCountDesc(brandCounts),
      regions: byCountDesc(regionCounts),
      genres: inLabelOrder(GENRE_LABEL, genreCounts),
      activityLevels: inLabelOrder(ACTIVITY_LABEL, activityCounts),
    };
  }

  private async assertThemeExists(themeId: string): Promise<void> {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true },
    });
    if (!theme) throw new AppException(THEME_ERROR.NOT_FOUND);
  }

  /** 삭제되지 않은 후기 기준 평점 요약. 평균은 소수 첫째 자리 반올림 (FR-REV-04). */
  private async getReviewSummary(
    themeId: string
  ): Promise<ThemeReviewSummary> {
    const groups = await this.prisma.review.groupBy({
      by: ["rating"],
      where: { themeId, status: "PUBLISHED" },
      _count: { _all: true },
    });
    const counts = new Map(
      groups.map((group) => [group.rating, group._count._all])
    );

    let reviewCount = 0;
    let ratingSum = 0;
    for (const [rating, count] of counts) {
      reviewCount += count;
      ratingSum += rating * count;
    }

    return {
      ratingAvg:
        reviewCount === 0
          ? null
          : Math.round((ratingSum / reviewCount) * 10) / 10,
      reviewCount,
      distribution: [5, 4, 3, 2, 1].map((rating) => ({
        rating,
        count: counts.get(rating) ?? 0,
      })),
    };
  }

  /** 로그인 사용자면 이 페이지의 테마에 대한 좋아요 여부를 한 번에 조회해 붙인다. */
  private async toListItems(
    rows: ThemeListRow[],
    userId: string | undefined
  ): Promise<ThemeListItem[]> {
    const likedIds = new Set<string>();
    if (userId && rows.length > 0) {
      const likes = await this.prisma.themeLike.findMany({
        where: { userId, themeId: { in: rows.map((row) => row.id) } },
        select: { themeId: true },
      });
      for (const like of likes) likedIds.add(like.themeId);
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      brandName: row.branch.brand.name,
      branchName: row.branch.name,
      region: row.branch.region,
      genre: row.genre,
      difficulty: row.difficulty,
      priceFrom: row.priceFrom,
      activityLevel: row.activityLevel,
      imageUrl: row.imageUrl,
      liked: likedIds.has(row.id),
    }));
  }
}

function isCollectionType(type: string): type is ThemeCollectionType {
  return (THEME_COLLECTION_TYPES as readonly string[]).includes(type);
}

/** 한국 시간 기준 "YYYY-MM-DD" */
function toSeoulDate(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 한국 시간 기준 "HH:mm" */
function toSeoulTime(date: Date): string {
  return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(11, 16);
}

/** "YYYY-MM-DD" 의 한국 시간 0시 */
function seoulMidnight(date: string): Date {
  return new Date(`${date}T00:00:00+09:00`);
}

function addDays(date: string, days: number): string {
  const utc = new Date(`${date}T00:00:00Z`);
  utc.setUTCDate(utc.getUTCDate() + days);
  return utc.toISOString().slice(0, 10);
}

function increment(counts: Map<string, number>, key: string, by: number) {
  counts.set(key, (counts.get(key) ?? 0) + by);
}

/** 브랜드 · 지역: 개수 많은 순, 같으면 이름순. value 와 label 이 같다. */
function byCountDesc(counts: Map<string, number>): ThemeFacetOption[] {
  return [...counts]
    .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
    .map(([value, count]) => ({ value, label: value, count }));
}

/** 장르 · 활동성: 라벨 정의 순서대로, 해당 테마가 있는 값만. */
function inLabelOrder<T extends string>(
  labels: Record<T, string>,
  counts: Map<T | null, number>
): ThemeFacetOption[] {
  return (Object.keys(labels) as T[])
    .filter((value) => counts.has(value))
    .map((value) => ({
      value,
      label: labels[value],
      count: counts.get(value) ?? 0,
    }));
}
