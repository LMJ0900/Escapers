import { http, delay } from "msw";

import type { getThemeDetailResponse } from "@/api/domain/theme/getThemeDetail/response/getThemeDetailRes";
import type { getThemeReviewsResponse } from "@/api/domain/theme/getThemeReviews/response/getThemeReviewsRes";
import type { getThemeSlotsResponse } from "@/api/domain/theme/getThemeSlots/response/getThemeSlotsRes";
import type { PutReviewHelpfulResponse } from "@/api/domain/theme/putReviewHelpful/response/PutReviewHelpfulRes";
import type {
  ThemeBranchInfo,
  ThemeGenre,
  ThemeReview,
  ThemeReviewSort,
  ThemeReviewSummary,
  ThemeSlotDay,
} from "@/api/domain/theme/Theme.type";

import {
  MOCK_POSTER_POOL,
  MOCK_THEME_CATALOG,
  type MockThemeListItem,
} from "@/mocks/handlers/theme";
import { reviewHelpfulStore } from "@/mocks/state/reviewHelpfulStore";
import { themeLikeStore } from "@/mocks/state/themeLikeStore";
import { authenticate, findAccountFromRequest } from "@/mocks/utils/auth";
import { fail, ok } from "@/mocks/utils/response";

/** 문자열을 항상 같은 양의 정수로 바꾼다. Math.random 없이 매번 같은 목 데이터를 만들기 위해 쓴다. */
function hash(value: string): number {
  let result = 5381;
  for (let i = 0; i < value.length; i++) {
    result = (result * 33 + value.charCodeAt(i)) >>> 0;
  }
  return result;
}

const POSTERS = MOCK_POSTER_POOL.filter(
  (poster): poster is string => poster !== null
);

// ============================== 지점 정보 ==============================

const REGION_GEO: Record<
  string,
  { district: string; road: string; station: string; lat: number; lng: number }
> = {
  강남: {
    district: "강남구",
    road: "강남대로",
    station: "강남역",
    lat: 37.4979,
    lng: 127.0276,
  },
  홍대: {
    district: "마포구",
    road: "양화로",
    station: "홍대입구역",
    lat: 37.5563,
    lng: 126.9236,
  },
  신촌: {
    district: "서대문구",
    road: "신촌로",
    station: "신촌역",
    lat: 37.5551,
    lng: 126.9368,
  },
  잠실: {
    district: "송파구",
    road: "올림픽로",
    station: "잠실역",
    lat: 37.5133,
    lng: 127.1002,
  },
  건대: {
    district: "광진구",
    road: "아차산로",
    station: "건대입구역",
    lat: 37.5404,
    lng: 127.0693,
  },
};

/** 지도가 없는 지점(좌표 미등록) 폴백 화면을 확인할 수 있도록 일부러 좌표를 비워 두는 테마. */
const THEME_ID_WITHOUT_COORDINATES = "catalog-5";

function buildBranch(theme: MockThemeListItem): ThemeBranchInfo {
  const seed = hash(`${theme.brandName}:${theme.branchName}`);
  const geo = REGION_GEO[theme.region] ?? REGION_GEO["강남"];
  const hasCoordinates = theme.id !== THEME_ID_WITHOUT_COORDINATES;

  return {
    name: `${theme.brandName} ${theme.branchName}`,
    address: `서울 ${geo.district} ${geo.road} ${10 + (seed % 80)}길 ${
      1 + (seed % 60)
    }, 지하 1층`,
    latitude: hasCoordinates ? geo.lat + ((seed % 200) - 100) * 0.00004 : null,
    longitude: hasCoordinates
      ? geo.lng + (((seed >> 3) % 200) - 100) * 0.00004
      : null,
    transit: `${geo.station} ${1 + (seed % 8)}번 출구 도보 ${3 + (seed % 7)}분`,
    // 크롤링 소스에 없는 항목은 null 로 내려오므로, 화면이 빈 값을 숨기는지 확인할 수 있게 일부를 비운다.
    phone:
      seed % 7 === 0
        ? null
        : `02-${1000 + (seed % 9000)}-${1000 + (seed % 8999)}`,
    openingHours: seed % 11 === 0 ? null : "매일 10:00 ~ 23:00",
    bookingUrl: `https://example.com/reserve/${theme.id}`,
  };
}

// ============================== 테마 설명 ==============================

const DESCRIPTIONS: Partial<Record<ThemeGenre, string[]>> = {
  HORROR: [
    "불이 꺼진 건물에 남겨진 기록을 따라 한 칸씩 안쪽으로 들어가다 보면, 이곳에서 무슨 일이 있었는지 서서히 드러납니다.",
    "공포 연출은 조명과 사운드 중심이며, 갑작스러운 노출은 최소화했습니다.",
  ],
  IMMERSIVE: [
    "입장하는 순간부터 이야기의 주인공이 되어 공간 곳곳에 숨겨진 단서를 직접 몸으로 찾아가는 체험형 테마입니다.",
    "연기자의 안내와 장치가 어우러져 처음 방탈출을 하는 분도 쉽게 몰입할 수 있습니다.",
  ],
  MYSTERY: [
    "흩어진 증거와 증언을 맞춰 보며 사건의 진실에 한 걸음씩 다가가는 추리 테마입니다.",
    "논리적으로 단서를 연결할수록 결말이 또렷해집니다.",
  ],
  SF: [
    "정체를 알 수 없는 신호가 감지된 연구 시설. 제한 시간 안에 시스템을 복구하고 탈출해야 합니다.",
    "장치와 연출이 많아 눈으로 보는 재미가 큽니다.",
  ],
  COMEDY: [
    "엉뚱한 설정과 유쾌한 퍼즐이 이어지는 가벼운 테마로, 친구나 가족과 함께 웃으며 즐기기 좋습니다.",
  ],
};

function buildDescription(theme: MockThemeListItem): string {
  const paragraphs = DESCRIPTIONS[theme.genre] ?? [
    "공간에 숨겨진 단서를 모아 제한 시간 안에 탈출하는 테마입니다.",
  ];
  return paragraphs.join("\n\n");
}

// ============================== 후기 ==============================

const REVIEW_NICKNAMES = [
  "탈출러_민",
  "방탈출덕후",
  "홍대토박이",
  "힌트없이도전",
  "새벽탈출",
  "퍼즐장인",
  "오늘도탈출",
  "손이빠른편",
  "겁쟁이탈출단",
  "열쇠수집가",
  "밀실마스터",
  "우리동네탐정",
];

const REVIEW_CONTENTS = [
  "입장하자마자 조명이랑 사운드가 확 바뀌는데 분위기가 압도적이었어요. 장치 위주라 어렵지 않게 즐길 수 있습니다.",
  "힌트를 쓰고도 시간이 모자랐어요. 후반부 퍼즐이 조금 불친절해서 호불호는 있을 것 같아요. 그래도 연출만큼은 최고였습니다.",
  "둘이서 했는데 활동성이 있어서 빠듯했어요. 인원이 조금 더 있으면 훨씬 여유 있게 즐길 수 있을 것 같아요.",
  "스토리가 탄탄해서 풀고 나서도 여운이 남아요. 인테리어가 정말 잘 되어 있어서 사진 찍기에도 좋았습니다.",
  "처음 방탈출을 해봤는데 직원분이 친절하게 설명해 주셔서 어렵지 않았어요. 다음에는 더 어려운 테마에 도전해 보려고요.",
  "난이도가 생각보다 높았어요. 단서를 놓치기 쉬워서 꼼꼼히 살펴보는 게 중요합니다.",
  "친구들이랑 가볍게 즐기기 딱 좋은 테마였어요. 시간 가는 줄 모르고 풀었습니다.",
  "마지막 반전이 인상 깊었어요. 자세한 내용은 직접 확인해 보세요.",
];

const REVIEW_RATING_POOL = [5, 5, 5, 5, 5, 4, 4, 4, 3, 2];

const reviewCache = new Map<string, Omit<ThemeReview, "helped">[]>();

/** 테마 id 마다 항상 같은 후기 목록을 만든다. 총 24~48개로, 페이지 단위 로딩을 확인할 수 있는 분량이다. */
function getBaseReviews(themeId: string): Omit<ThemeReview, "helped">[] {
  const cached = reviewCache.get(themeId);
  if (cached) return cached;

  const total = 24 + (hash(themeId) % 25);
  const reviews = Array.from({ length: total }, (_, index) => {
    const seed = hash(`${themeId}:${index}`);
    const cleared = seed % 3 !== 0;
    const photoCount = seed % 4 === 0 ? 1 + (seed % 2) : 0;

    return {
      id: `${themeId}-review-${index + 1}`,
      nickname: REVIEW_NICKNAMES[seed % REVIEW_NICKNAMES.length],
      rating: REVIEW_RATING_POOL[seed % REVIEW_RATING_POOL.length],
      // 최신 후기가 앞에 오도록 하루씩 거슬러 올라간다.
      writtenAt: new Date(Date.UTC(2026, 9, 10 - index))
        .toISOString()
        .slice(0, 10),
      playerCount: 2 + (seed % 4),
      cleared,
      remainingSeconds: cleared ? 15 + (seed % 540) : null,
      hintCount: cleared ? null : seed % 4,
      content: REVIEW_CONTENTS[seed % REVIEW_CONTENTS.length],
      photoUrls: Array.from(
        { length: photoCount },
        (_, photoIndex) => POSTERS[(seed + photoIndex) % POSTERS.length]
      ),
      helpfulCount: (seed >> 2) % 60,
    };
  });

  reviewCache.set(themeId, reviews);
  return reviews;
}

function buildSummary(themeId: string): ThemeReviewSummary {
  const reviews = getBaseReviews(themeId);
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => review.rating === rating).length,
  }));
  const sum = reviews.reduce((acc, review) => acc + review.rating, 0);

  return {
    ratingAvg:
      reviews.length === 0
        ? null
        : Math.round((sum / reviews.length) * 10) / 10,
    reviewCount: reviews.length,
    distribution,
  };
}

function sortReviews(
  reviews: ThemeReview[],
  sort: ThemeReviewSort
): ThemeReview[] {
  const byNewest = (a: ThemeReview, b: ThemeReview) =>
    b.writtenAt.localeCompare(a.writtenAt) || a.id.localeCompare(b.id);

  switch (sort) {
    case "NEWEST":
      return [...reviews].sort(byNewest);
    case "RATING_DESC":
      return [...reviews].sort((a, b) => b.rating - a.rating || byNewest(a, b));
    case "RATING_ASC":
      return [...reviews].sort((a, b) => a.rating - b.rating || byNewest(a, b));
    case "HELPFUL":
    default:
      return [...reviews].sort(
        (a, b) => b.helpfulCount - a.helpfulCount || byNewest(a, b)
      );
  }
}

// ============================== 예약 가능 시간 ==============================

const SLOT_TIMES = ["14:00", "16:00", "18:00", "20:00"] as const;
const SLOT_DAYS = 7;

/** 한국 시간 기준 오늘 날짜 "YYYY-MM-DD". */
function todayInSeoul(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(
    new Date()
  );
}

function buildSlotDays(themeId: string): ThemeSlotDay[] {
  const [year, month, day] = todayInSeoul().split("-").map(Number);

  return Array.from({ length: SLOT_DAYS }, (_, offset) => {
    const date = new Date(Date.UTC(year, month - 1, day + offset))
      .toISOString()
      .slice(0, 10);

    return {
      date,
      slots: SLOT_TIMES.map((time) => ({
        time,
        available: hash(`${themeId}:${date}:${time}`) % 4 !== 0,
      })),
    };
  });
}

// ============================== 핸들러 ==============================

function findTheme(themeId: string) {
  return MOCK_THEME_CATALOG.find((theme) => theme.id === themeId);
}

const themeNotFound = {
  code: "THEME_NOT_FOUND",
  message: "존재하지 않는 테마입니다.",
  status: 404,
} as const;

export const handlers = [
  http.get("*/theme/:id", async ({ request, params }) => {
    await delay(250);

    const theme = findTheme(String(params.id));
    if (!theme) return fail<getThemeDetailResponse>(themeNotFound);

    const account = findAccountFromRequest(request);
    const liked = account
      ? themeLikeStore.isLiked(account.email, theme.id)
      : false;
    const seed = hash(theme.id);
    const summary = buildSummary(theme.id);

    return ok<getThemeDetailResponse>({
      ...theme,
      liked,
      likeCount: 80 + (seed % 420) + (liked ? 1 : 0),
      minPlayers: 2,
      maxPlayers: 4 + (seed % 3),
      playMinutes: 60 + (seed % 3) * 10,
      description: buildDescription(theme),
      ratingAvg: summary.ratingAvg,
      reviewCount: summary.reviewCount,
      branch: buildBranch(theme),
    });
  }),

  http.get("*/theme/:id/slots", async ({ params }) => {
    await delay(250);

    const theme = findTheme(String(params.id));
    if (!theme) return fail<getThemeSlotsResponse>(themeNotFound);

    return ok<getThemeSlotsResponse>({ days: buildSlotDays(theme.id) });
  }),

  http.get("*/theme/:id/reviews", async ({ request, params }) => {
    await delay(300);

    const theme = findTheme(String(params.id));
    if (!theme) return fail<getThemeReviewsResponse>(themeNotFound);

    const sp = new URL(request.url).searchParams;
    const sort = (sp.get("sort") as ThemeReviewSort | null) ?? "HELPFUL";
    const photoOnly = sp.get("photoOnly") === "true";
    const size = Number(sp.get("size") ?? 5);
    const cursor = sp.get("cursor");

    const account = findAccountFromRequest(request);
    const reviews: ThemeReview[] = getBaseReviews(theme.id).map((review) => {
      const helped = account
        ? reviewHelpfulStore.isHelped(account.email, review.id)
        : false;
      return {
        ...review,
        helped,
        helpfulCount: review.helpfulCount + (helped ? 1 : 0),
      };
    });

    const sorted = sortReviews(
      photoOnly
        ? reviews.filter((review) => review.photoUrls.length > 0)
        : reviews,
      sort
    );

    const startIndex = cursor ? Number(cursor) : 0;
    const nextIndex = startIndex + size;

    return ok<getThemeReviewsResponse>({
      items: sorted.slice(startIndex, nextIndex),
      nextCursor: nextIndex < sorted.length ? String(nextIndex) : null,
      summary: buildSummary(theme.id),
    });
  }),

  http.put(
    "*/theme/:themeId/reviews/:reviewId/helpful",
    async ({ request, params }) => {
      const body = (await request.json()) as { helped: boolean };
      await delay(200);

      const auth = authenticate(request);
      if ("error" in auth) return fail<PutReviewHelpfulResponse>(auth.error);

      const theme = findTheme(String(params.themeId));
      if (!theme) return fail<PutReviewHelpfulResponse>(themeNotFound);

      const review = getBaseReviews(theme.id).find(
        (item) => item.id === String(params.reviewId)
      );
      if (!review) {
        return fail<PutReviewHelpfulResponse>({
          code: "REVIEW_NOT_FOUND",
          message: "존재하지 않는 후기입니다.",
          status: 404,
        });
      }

      reviewHelpfulStore.setHelped(auth.account.email, review.id, body.helped);

      return ok<PutReviewHelpfulResponse>({
        helped: body.helped,
        helpfulCount: review.helpfulCount + (body.helped ? 1 : 0),
      });
    }
  ),
];
