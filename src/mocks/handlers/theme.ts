import { http, HttpResponse, delay } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { getHotThemesResponse } from "@/api/domain/theme/getHotThemes/response/getHotThemesRes";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";
import type { ThemeAuthErrorCode } from "@/api/domain/theme/Theme.error";

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

/** 테마 도메인이 아직 없어 목 데이터로 대신한다. 실제 테마 도메인이 생기면 이 핸들러를 교체한다. */
const MOCK_HOT_THEMES: Omit<getHotThemesResponse[number], "liked">[] = [
  { id: "theme-1", rank: 1, name: "더 라스트 룸", branchName: "강남점" },
  { id: "theme-2", rank: 2, name: "비밀의 정원", branchName: "홍대점" },
  { id: "theme-3", rank: 3, name: "붉은 방", branchName: "강남점" },
  { id: "theme-4", rank: 4, name: "오르골의 저주", branchName: "신촌점" },
  { id: "theme-5", rank: 5, name: "침묵의 서재", branchName: "홍대점" },
  { id: "theme-6", rank: 6, name: "13번째 손님", branchName: "강남점" },
  { id: "theme-7", rank: 7, name: "유령의 집", branchName: "잠실점" },
  { id: "theme-8", rank: 8, name: "시간의 문", branchName: "신촌점" },
  { id: "theme-9", rank: 9, name: "마지막 실험실", branchName: "홍대점" },
  { id: "theme-10", rank: 10, name: "달빛 미궁", branchName: "잠실점" },
];

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

export const handlers = [
  // 비로그인 사용자도 볼 수 있는 공개 목록이라 인증을 요구하지 않는다.
  // 로그인 상태면 계정별 좋아요 여부를 함께 내려준다.
  http.get("*/theme/hot", async ({ request }) => {
    await delay(300);

    const account = findAccountFromRequest(request);

    const data: getHotThemesResponse = MOCK_HOT_THEMES.map((theme) => ({
      ...theme,
      liked: account ? themeLikeStore.isLiked(account.email, theme.id) : false,
    }));

    return ok(data);
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
