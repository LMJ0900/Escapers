import { http, HttpResponse, delay } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { getMyReservationsResponse } from "@/api/domain/reservation/getMyReservations/response/getMyReservationsRes";

import { MOCK_EXPIRED_ACCESS_JWT } from "@/mocks/handlers/auth";
import { accountStore } from "@/mocks/state/accountStore";
import { getEmailFromToken } from "@/mocks/state/token";

const ok = (data: getMyReservationsResponse) =>
  HttpResponse.json<ApiResponse<getMyReservationsResponse>>(
    { result: "SUCCESS", data, error: null },
    { status: 200 }
  );

const fail = (error: ApiErrorResponse) =>
  HttpResponse.json<ApiResponse<getMyReservationsResponse>>(
    { result: "ERROR", data: null, error },
    { status: error.status }
  );

/**
 * 예약 도메인이 아직 없어 계정별 데이터를 실제로 나누지 않고, 로그인된 계정이면
 * 동일한 목 데이터를 보여준다. 예약 도메인이 생기면 이 핸들러를 교체한다.
 */
const MOCK_RESERVATIONS: getMyReservationsResponse = [
  {
    id: "res-1",
    themeName: "더 라스트 룸",
    branchName: "강남점",
    scheduledAt: "2026-10-03T18:00:00+09:00",
    headcount: 3,
    status: "CONFIRMED",
    hasReview: false,
  },
  {
    id: "res-2",
    themeName: "비밀의 정원",
    branchName: "홍대점",
    scheduledAt: "2026-08-14T20:00:00+09:00",
    headcount: 2,
    status: "COMPLETED",
    hasReview: false,
  },
  {
    id: "res-3",
    themeName: "더 라스트 룸",
    branchName: "강남점",
    scheduledAt: "2026-07-02T16:00:00+09:00",
    headcount: 4,
    status: "COMPLETED",
    hasReview: true,
  },
];

export const handlers = [
  http.get("*/reservation/me", async ({ request }) => {
    await delay(300);

    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return fail({
        code: "AUTH_TOKEN_MISSING",
        message: "인증 토큰이 없습니다.",
        status: 401,
      });
    }

    if (token === MOCK_EXPIRED_ACCESS_JWT) {
      return fail({
        code: "AUTH_TOKEN_EXPIRED",
        message: "인증 토큰이 만료되었습니다.",
        status: 401,
      });
    }

    const email = getEmailFromToken(token);
    const account = email ? accountStore.findByEmail(email) : undefined;

    if (!account) {
      return fail({
        code: "AUTH_TOKEN_INVALID",
        message: "유효하지 않은 인증 토큰입니다.",
        status: 401,
      });
    }

    return ok(MOCK_RESERVATIONS);
  }),
];
