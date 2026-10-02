import { http, HttpResponse, delay } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { getThemeCollectionResponse } from "@/api/domain/theme/getThemeCollection/response/getThemeCollectionRes";
import type { getThemesResponse } from "@/api/domain/theme/getThemes/response/getThemesRes";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";
import { ACTIVITY_LABEL, GENRE_LABEL } from "@/api/domain/theme/Theme.filter";
import type { ThemeAuthErrorCode } from "@/api/domain/theme/Theme.error";
import type {
  ThemeActivityLevel,
  ThemeCollectionType,
  ThemeFacetOption,
  ThemeFacets,
  ThemeGenre,
  ThemeListItem,
  ThemeSortOption,
} from "@/api/domain/theme/Theme.type";

import { MOCK_EXPIRED_ACCESS_JWT } from "@/mocks/handlers/auth";
import { accountStore } from "@/mocks/state/accountStore";
import { themeLikeStore } from "@/mocks/state/themeLikeStore";
import { getEmailFromToken } from "@/mocks/state/token";

const ok = <TData>(data: TData) =>
  HttpResponse.json<ApiResponse<TData>>(
    { result: "SUCCESS", data, error: null },
    { status: 200 }
  );

const fail = <TData = null>(error: ApiErrorResponse) =>
  HttpResponse.json<ApiResponse<TData>>(
    { result: "ERROR", data: null, error },
    { status: error.status }
  );

type MockThemeListItem = Omit<ThemeListItem, "liked">;

/**
 * 손으로 적어둔 테마 목록. 좋아요 동기화를 확인할 수 있도록 핫/공포/활동성 목록과
 * id를 겹쳐서 재사용하고, 커버되지 않는 지점(건대)과 장르(코미디) 예시를 위해
 * catalog-* 를 몇 개 더 둔다. 필터·정렬·무한 스크롤을 넉넉히 테스트할 수 있도록
 * 아래 `generateCatalogExtras`로 만든 항목과 합쳐 전체 카탈로그를 200개로 채운다.
 */
const HANDWRITTEN_THEMES: MockThemeListItem[] = [
  {
    id: "theme-1",
    name: "더 라스트 룸",
    brandName: "제로월드",
    branchName: "강남점",
    region: "강남",
    genre: "MYSTERY",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "MEDIUM",
  },
  {
    id: "theme-2",
    name: "비밀의 정원",
    brandName: "비밀의 문",
    branchName: "홍대점",
    region: "홍대",
    genre: "IMMERSIVE",
    difficulty: 3,
    priceFrom: 24000,
    activityLevel: "MEDIUM",
  },
  {
    id: "theme-3",
    name: "붉은 방",
    brandName: "넥스트룸",
    branchName: "강남점",
    region: "강남",
    genre: "HORROR",
    difficulty: 5,
    priceFrom: 28000,
    activityLevel: "LOW",
  },
  {
    id: "theme-4",
    name: "오르골의 저주",
    brandName: "미스터리박스",
    branchName: "신촌점",
    region: "신촌",
    genre: "HORROR",
    difficulty: 2,
    priceFrom: 22000,
    activityLevel: "LOW",
  },
  {
    id: "theme-5",
    name: "침묵의 서재",
    brandName: "제로월드",
    branchName: "홍대점",
    region: "홍대",
    genre: "MYSTERY",
    difficulty: 3,
    priceFrom: 23000,
    activityLevel: "MEDIUM",
  },
  {
    id: "theme-6",
    name: "13번째 손님",
    brandName: "비밀의 문",
    branchName: "강남점",
    region: "강남",
    genre: "HORROR",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "LOW",
  },
  {
    id: "theme-7",
    name: "유령의 집",
    brandName: "넥스트룸",
    branchName: "잠실점",
    region: "잠실",
    genre: "HORROR",
    difficulty: 3,
    priceFrom: 24000,
    activityLevel: "LOW",
  },
  {
    id: "theme-8",
    name: "시간의 문",
    brandName: "미스터리박스",
    branchName: "신촌점",
    region: "신촌",
    genre: "SF",
    difficulty: 4,
    priceFrom: 25000,
    activityLevel: "HIGH",
  },
  {
    id: "theme-9",
    name: "마지막 실험실",
    brandName: "제로월드",
    branchName: "홍대점",
    region: "홍대",
    genre: "SF",
    difficulty: 3,
    priceFrom: 25000,
    activityLevel: "MEDIUM",
  },
  {
    id: "theme-10",
    name: "달빛 미궁",
    brandName: "비밀의 문",
    branchName: "잠실점",
    region: "잠실",
    genre: "MYSTERY",
    difficulty: 2,
    priceFrom: 22000,
    activityLevel: "MEDIUM",
  },
  {
    id: "horror-4",
    name: "지하 3층 병동",
    brandName: "넥스트룸",
    branchName: "홍대점",
    region: "홍대",
    genre: "HORROR",
    difficulty: 5,
    priceFrom: 27000,
    activityLevel: "MEDIUM",
  },
  {
    id: "horror-5",
    name: "폐교의 밤",
    brandName: "미스터리박스",
    branchName: "강남점",
    region: "강남",
    genre: "HORROR",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "LOW",
  },
  {
    id: "horror-6",
    name: "인형의 방",
    brandName: "제로월드",
    branchName: "잠실점",
    region: "잠실",
    genre: "HORROR",
    difficulty: 3,
    priceFrom: 23000,
    activityLevel: "MEDIUM",
  },
  {
    id: "horror-7",
    name: "검은 우물",
    brandName: "비밀의 문",
    branchName: "신촌점",
    region: "신촌",
    genre: "HORROR",
    difficulty: 4,
    priceFrom: 25000,
    activityLevel: "LOW",
  },
  {
    id: "horror-8",
    name: "자정의 장례식",
    brandName: "넥스트룸",
    branchName: "홍대점",
    region: "홍대",
    genre: "HORROR",
    difficulty: 5,
    priceFrom: 28000,
    activityLevel: "MEDIUM",
  },
  {
    id: "horror-9",
    name: "끝나지 않는 복도",
    brandName: "미스터리박스",
    branchName: "강남점",
    region: "강남",
    genre: "HORROR",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "HIGH",
  },
  {
    id: "horror-10",
    name: "그녀의 일기장",
    brandName: "제로월드",
    branchName: "잠실점",
    region: "잠실",
    genre: "HORROR",
    difficulty: 3,
    priceFrom: 24000,
    activityLevel: "MEDIUM",
  },
  {
    id: "active-3",
    name: "레이저 금고",
    brandName: "비밀의 문",
    branchName: "홍대점",
    region: "홍대",
    genre: "IMMERSIVE",
    difficulty: 3,
    priceFrom: 24000,
    activityLevel: "HIGH",
  },
  {
    id: "active-4",
    name: "탈옥",
    brandName: "넥스트룸",
    branchName: "잠실점",
    region: "잠실",
    genre: "IMMERSIVE",
    difficulty: 4,
    priceFrom: 27000,
    activityLevel: "HIGH",
  },
  {
    id: "active-5",
    name: "정글 탐험대",
    brandName: "미스터리박스",
    branchName: "강남점",
    region: "강남",
    genre: "COMEDY",
    difficulty: 2,
    priceFrom: 23000,
    activityLevel: "HIGH",
  },
  {
    id: "active-6",
    name: "잠수함 탈출",
    brandName: "제로월드",
    branchName: "신촌점",
    region: "신촌",
    genre: "SF",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "HIGH",
  },
  {
    id: "active-7",
    name: "밀실 추격전",
    brandName: "비밀의 문",
    branchName: "홍대점",
    region: "홍대",
    genre: "IMMERSIVE",
    difficulty: 3,
    priceFrom: 24000,
    activityLevel: "HIGH",
  },
  {
    id: "active-8",
    name: "무너지는 탑",
    brandName: "넥스트룸",
    branchName: "잠실점",
    region: "잠실",
    genre: "IMMERSIVE",
    difficulty: 5,
    priceFrom: 28000,
    activityLevel: "HIGH",
  },
  {
    id: "active-9",
    name: "닌자의 수련장",
    brandName: "미스터리박스",
    branchName: "강남점",
    region: "강남",
    genre: "IMMERSIVE",
    difficulty: 3,
    priceFrom: 23000,
    activityLevel: "HIGH",
  },
  {
    id: "active-10",
    name: "폭주 기관차",
    brandName: "제로월드",
    branchName: "신촌점",
    region: "신촌",
    genre: "IMMERSIVE",
    difficulty: 4,
    priceFrom: 25000,
    activityLevel: "HIGH",
  },
  {
    id: "catalog-1",
    name: "황금 열쇠",
    brandName: "넥스트룸",
    branchName: "건대점",
    region: "건대",
    genre: "MYSTERY",
    difficulty: 2,
    priceFrom: 21000,
    activityLevel: "MEDIUM",
  },
  {
    id: "catalog-2",
    name: "붉은 달의 밤",
    brandName: "미스터리박스",
    branchName: "건대점",
    region: "건대",
    genre: "HORROR",
    difficulty: 4,
    priceFrom: 25000,
    activityLevel: "LOW",
  },
  {
    id: "catalog-3",
    name: "왕좌의 비밀",
    brandName: "비밀의 문",
    branchName: "강남점",
    region: "강남",
    genre: "IMMERSIVE",
    difficulty: 3,
    priceFrom: 27000,
    activityLevel: "HIGH",
  },
  {
    id: "catalog-4",
    name: "얼음 왕국",
    brandName: "제로월드",
    branchName: "홍대점",
    region: "홍대",
    genre: "COMEDY",
    difficulty: 2,
    priceFrom: 22000,
    activityLevel: "MEDIUM",
  },
  {
    id: "catalog-5",
    name: "심해의 부름",
    brandName: "넥스트룸",
    branchName: "신촌점",
    region: "신촌",
    genre: "SF",
    difficulty: 4,
    priceFrom: 26000,
    activityLevel: "LOW",
  },
];

/** 홈 화면 캐러셀이 쓰는 순위 목록. 손으로 적어둔 테마에서 id 순서만 골라 순위를 매긴다. */
function buildRankedThemeList(
  ids: string[]
): (MockThemeListItem & { rank: number })[] {
  return ids.map((id, index) => {
    const theme = HANDWRITTEN_THEMES.find((item) => item.id === id);
    if (!theme) throw new Error(`순위 목록에 알 수 없는 테마 id: ${id}`);
    return { ...theme, rank: index + 1 };
  });
}

/** 테마 도메인이 아직 없어 목 데이터로 대신한다. 실제 테마 도메인이 생기면 이 핸들러를 교체한다. */
const MOCK_HOT_THEMES = buildRankedThemeList([
  "theme-1",
  "theme-2",
  "theme-3",
  "theme-4",
  "theme-5",
  "theme-6",
  "theme-7",
  "theme-8",
  "theme-9",
  "theme-10",
]);

/** 일부 테마는 핫한 테마와 id를 겹쳐, 한 목록에서 누른 좋아요가 다른 목록에도 반영되는지 확인할 수 있게 한다. */
const MOCK_HORROR_THEMES = buildRankedThemeList([
  "theme-3",
  "theme-4",
  "theme-7",
  "horror-4",
  "horror-5",
  "horror-6",
  "horror-7",
  "horror-8",
  "horror-9",
  "horror-10",
]);

const MOCK_ACTIVE_THEMES = buildRankedThemeList([
  "theme-8",
  "horror-9",
  "active-3",
  "active-4",
  "active-5",
  "active-6",
  "active-7",
  "active-8",
  "active-9",
  "active-10",
]);

const BRAND_ORDER = [
  "제로월드",
  "비밀의 문",
  "넥스트룸",
  "미스터리박스",
] as const;
const REGION_ORDER = ["강남", "홍대", "신촌", "잠실", "건대"] as const;
const GENRE_ORDER: ThemeGenre[] = [
  "HORROR",
  "IMMERSIVE",
  "MYSTERY",
  "SF",
  "COMEDY",
];
const ACTIVITY_ORDER: ThemeActivityLevel[] = ["HIGH", "MEDIUM", "LOW"];

const GEN_NAME_PREFIXES = [
  "황금의",
  "붉은",
  "잊혀진",
  "얼어붙은",
  "부서진",
  "불타는",
  "저주받은",
  "숨겨진",
  "끝없는",
  "달빛",
  "칠흑의",
  "유리",
  "강철",
  "모래의",
  "안개의",
  "폭풍의",
  "속삭이는",
  "잠든",
  "타오르는",
  "서리의",
] as const;

const GEN_NAME_NOUNS = [
  "미궁",
  "지하실",
  "실험실",
  "서재",
  "정원",
  "성채",
  "탑",
  "항구",
  "극장",
  "박물관",
  "예배당",
  "공방",
  "온실",
  "등대",
  "터널",
  "광산",
  "별장",
  "수족관",
  "도서관",
  "발전소",
] as const;

/**
 * 손으로 적은 테마 외에 필터·정렬·무한 스크롤을 넉넉히 테스트할 수 있도록 나머지
 * 분량을 규칙적으로(= Math.random 없이, 매번 같은 결과로) 만들어낸다.
 */
function generateCatalogExtras(count: number): MockThemeListItem[] {
  return Array.from({ length: count }, (_, i) => {
    const region = REGION_ORDER[i % REGION_ORDER.length];
    const difficulty = (i % 5) + 1;
    const prefix = GEN_NAME_PREFIXES[i % GEN_NAME_PREFIXES.length];
    const noun =
      GEN_NAME_NOUNS[
        Math.floor(i / GEN_NAME_PREFIXES.length) % GEN_NAME_NOUNS.length
      ];

    return {
      id: `gen-${i + 1}`,
      name: `${prefix} ${noun}`,
      brandName: BRAND_ORDER[i % BRAND_ORDER.length],
      branchName: `${region}점`,
      region,
      genre: GENRE_ORDER[i % GENRE_ORDER.length],
      difficulty,
      priceFrom: 20000 + difficulty * 1200 + (i % 4) * 500,
      activityLevel: ACTIVITY_ORDER[i % ACTIVITY_ORDER.length],
    };
  });
}

/** "모든 테마" 목록(필터·정렬·무한 스크롤)의 전체 카탈로그 — 총 200개. */
const MOCK_THEME_CATALOG: MockThemeListItem[] = [
  ...HANDWRITTEN_THEMES,
  ...generateCatalogExtras(200 - HANDWRITTEN_THEMES.length),
];

/** 전체 카탈로그 기준으로 값별 개수를 세어, 주어진 순서대로 facet 옵션을 만든다. */
function buildFacet<T extends string>(
  pick: (item: MockThemeListItem) => T,
  order: readonly T[],
  label: (value: T) => string
): ThemeFacetOption[] {
  const counts = new Map<string, number>();
  for (const item of MOCK_THEME_CATALOG) {
    const value = pick(item);
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return order
    .filter((value) => counts.has(value))
    .map((value) => ({
      value,
      label: label(value),
      count: counts.get(value)!,
    }));
}

const THEME_FACETS: ThemeFacets = {
  brands: buildFacet(
    (item) => item.brandName,
    BRAND_ORDER,
    (v) => v
  ),
  regions: buildFacet(
    (item) => item.region,
    REGION_ORDER,
    (v) => v
  ),
  genres: buildFacet(
    (item) => item.genre,
    GENRE_ORDER,
    (v) => GENRE_LABEL[v]
  ),
  activityLevels: buildFacet(
    (item) => item.activityLevel,
    ACTIVITY_ORDER,
    (v) => ACTIVITY_LABEL[v]
  ),
};

/** 정렬 기준에 따라 카탈로그를 정렬한다. '최신순'은 목 데이터라 카탈로그 배열의 등록 순서를 역순으로 쓴다. */
function sortCatalog(
  items: MockThemeListItem[],
  sort: ThemeSortOption
): MockThemeListItem[] {
  const ACTIVITY_WEIGHT: Record<ThemeActivityLevel, number> = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2,
  };
  const indexOf = (item: MockThemeListItem) => MOCK_THEME_CATALOG.indexOf(item);

  switch (sort) {
    case "PRICE_ASC":
      return [...items].sort((a, b) => a.priceFrom - b.priceFrom);
    case "PRICE_DESC":
      return [...items].sort((a, b) => b.priceFrom - a.priceFrom);
    case "NEWEST":
      return [...items].sort((a, b) => indexOf(b) - indexOf(a));
    case "DIFFICULTY_DESC":
      return [...items].sort(
        (a, b) =>
          b.difficulty - a.difficulty ||
          ACTIVITY_WEIGHT[a.activityLevel] - ACTIVITY_WEIGHT[b.activityLevel]
      );
    case "DIFFICULTY_ASC":
      return [...items].sort(
        (a, b) =>
          a.difficulty - b.difficulty ||
          ACTIVITY_WEIGHT[a.activityLevel] - ACTIVITY_WEIGHT[b.activityLevel]
      );
    case "POPULAR":
    default:
      return [...items].sort(
        (a, b) =>
          ACTIVITY_WEIGHT[a.activityLevel] - ACTIVITY_WEIGHT[b.activityLevel]
      );
  }
}

/** Authorization 헤더가 있으면 계정을 찾아 반환하고, 없거나 유효하지 않으면 null(비로그인 취급). */
function findAccountFromRequest(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  if (!token || token === MOCK_EXPIRED_ACCESS_JWT) return null;

  const email = getEmailFromToken(token);
  return email ? (accountStore.findByEmail(email) ?? null) : null;
}

/** /theme/{id}/like 처럼 로그인이 필수인 핸들러가 공유하는 인증 단계. */
function authenticate(
  request: Request
): { email: string } | { error: ApiErrorResponse<ThemeAuthErrorCode> } {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;

  if (!token) {
    return {
      error: {
        code: "AUTH_TOKEN_MISSING",
        message: "인증 토큰이 없습니다.",
        status: 401,
      },
    };
  }

  if (token === MOCK_EXPIRED_ACCESS_JWT) {
    return {
      error: {
        code: "AUTH_TOKEN_EXPIRED",
        message: "인증 토큰이 만료되었습니다.",
        status: 401,
      },
    };
  }

  const email = getEmailFromToken(token);
  const account = email ? accountStore.findByEmail(email) : undefined;

  if (!account) {
    return {
      error: {
        code: "AUTH_TOKEN_INVALID",
        message: "유효하지 않은 인증 토큰입니다.",
        status: 401,
      },
    };
  }

  return { email: account.email };
}

const MOCK_THEME_COLLECTIONS: Record<
  ThemeCollectionType,
  (MockThemeListItem & { rank: number })[]
> = {
  hot: MOCK_HOT_THEMES,
  horror: MOCK_HORROR_THEMES,
  active: MOCK_ACTIVE_THEMES,
};

export const handlers = [
  /**
   * 홈 화면 캐러셀용 테마 묶음. 비로그인 사용자도 볼 수 있는 공개 목록이라 인증을 요구하지 않고,
   * 로그인 상태면 계정별 좋아요 여부를 함께 내려준다.
   */
  http.get("*/theme/collections/:type", async ({ request, params }) => {
    await delay(300);

    const themes =
      MOCK_THEME_COLLECTIONS[String(params.type) as ThemeCollectionType];
    if (!themes) {
      return fail<getThemeCollectionResponse>({
        code: "THEME_COLLECTION_NOT_FOUND",
        message: "존재하지 않는 테마 묶음입니다.",
        status: 404,
      });
    }

    const account = findAccountFromRequest(request);

    const data: ThemeListItem[] = themes.map((theme) => ({
      ...theme,
      liked: account ? themeLikeStore.isLiked(account.email, theme.id) : false,
    }));

    return ok<getThemeCollectionResponse>(data);
  }),

  /** "모든 테마" 목록 — 필터·정렬은 searchParams로, 다음 묶음은 cursor(인덱스 문자열)로 받는다. */
  http.get("*/theme", async ({ request }) => {
    await delay(300);

    const url = new URL(request.url);
    const sp = url.searchParams;
    const splitParam = (key: string) =>
      sp.get(key)?.split(",").filter(Boolean) ?? [];

    const brands = splitParam("brands");
    const regions = splitParam("regions");
    const genres = splitParam("genres");
    const activityLevels = splitParam("activityLevels");
    const sort = (sp.get("sort") as ThemeSortOption | null) ?? "POPULAR";
    const size = Number(sp.get("size") ?? 20);
    const cursor = sp.get("cursor");

    const filtered = MOCK_THEME_CATALOG.filter(
      (item) =>
        (brands.length === 0 || brands.includes(item.brandName)) &&
        (regions.length === 0 || regions.includes(item.region)) &&
        (genres.length === 0 || genres.includes(item.genre)) &&
        (activityLevels.length === 0 ||
          activityLevels.includes(item.activityLevel))
    );
    const sorted = sortCatalog(filtered, sort);

    const startIndex = cursor ? Number(cursor) : 0;
    const page = sorted.slice(startIndex, startIndex + size);
    const nextIndex = startIndex + size;
    const nextCursor = nextIndex < sorted.length ? String(nextIndex) : null;

    const account = findAccountFromRequest(request);
    const items: ThemeListItem[] = page.map((item) => ({
      ...item,
      liked: account ? themeLikeStore.isLiked(account.email, item.id) : false,
    }));

    return ok<getThemesResponse>({
      items,
      nextCursor,
      totalCount: sorted.length,
      facets: THEME_FACETS,
    });
  }),

  http.put("*/theme/:id/like", async ({ request, params }) => {
    const body = (await request.json()) as { liked: boolean };
    await delay(200);

    const auth = authenticate(request);
    if ("error" in auth) return fail<PutThemeLikeResponse>(auth.error);

    themeLikeStore.setLiked(auth.email, String(params.id), body.liked);

    return ok<PutThemeLikeResponse>({ liked: body.liked });
  }),
];
