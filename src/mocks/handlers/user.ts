import { http, HttpResponse, delay } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import type { UserAuthErrorCode } from "@/api/domain/user/User.error";

import { MOCK_ACCESS_JWT, MOCK_EXPIRED_ACCESS_JWT } from "@/mocks/handlers/auth";

const MOCK_ME: getMeResponse = {
  id: "mock-user-1",
  role: "MEMBER",
  email: "mock@test.com",
  nickname: "테스트유저",
};

const ok = (data: getMeResponse) =>
  HttpResponse.json<ApiResponse<getMeResponse>>(
    { result: "SUCCESS", data, error: null },
    { status: 200 }
  );

const fail = (error: ApiErrorResponse<UserAuthErrorCode>) =>
  HttpResponse.json<ApiResponse<getMeResponse>>(
    { result: "ERROR", data: null, error },
    { status: error.status }
  );

export const handlers = [
  http.get("*/user/getMe", async ({ request }) => {
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

    if (token !== MOCK_ACCESS_JWT) {
      return fail({
        code: "AUTH_TOKEN_INVALID",
        message: "유효하지 않은 인증 토큰입니다.",
        status: 401,
      });
    }

    return ok(MOCK_ME);
  }),
];
