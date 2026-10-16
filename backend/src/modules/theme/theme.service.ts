import { Injectable } from "@nestjs/common";
import { AppException } from "../../common/exception/app.exception";
import { PrismaService } from "../../infra/prisma/prisma.service";
import type { Prisma } from "../../generated/prisma/client";
import {
  encodeThemeCursor,
  themeAfterCursor,
  themeOrderBy,
} from "./theme.cursor";
import { THEME_ERROR } from "./theme.error";
import { ACTIVITY_LABEL, GENRE_LABEL } from "./theme.label";
import {
  THEME_COLLECTION_TYPES,
  type GetThemesQuery,
  type GetThemesResponse,
  type PutThemeLikeRequest,
  type PutThemeLikeResponse,
  type ThemeCollectionType,
  type ThemeFacetOption,
  type ThemeFacets,
  type ThemeListItem,
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

  /** 목표 상태(liked)를 반영하는 멱등 연산 — 연타해도 최종 상태만 남는다 (백엔드 명세서 §4.3). */
  async putLike(
    userId: string,
    themeId: string,
    body: PutThemeLikeRequest
  ): Promise<PutThemeLikeResponse> {
    const theme = await this.prisma.theme.findUnique({
      where: { id: themeId },
      select: { id: true },
    });
    if (!theme) throw new AppException(THEME_ERROR.NOT_FOUND);

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
