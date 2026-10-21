import { http, delay } from "msw";

import type { getMyReservationsResponse } from "@/api/domain/reservation/getMyReservations/response/getMyReservationsRes";

import { authenticate } from "@/mocks/utils/auth";
import { fail, ok } from "@/mocks/utils/response";

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

    const auth = authenticate(request);
    if ("error" in auth) return fail<getMyReservationsResponse>(auth.error);

    return ok(MOCK_RESERVATIONS);
  }),
];
