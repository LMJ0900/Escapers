import { http, HttpResponse, delay, passthrough } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { LoginRequest } from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";

const VALID = { email: "mock@test.com", password: "test1234!" };

const SUCCESS_DATA: LoginResponse = {
  accessJwt: "eyJhbGciOiJIUzI1NiJ9.fake-access-payload.sig",
  refreshJwt: "eyJhbGciOiJIUzI1NiJ9.fake-refresh-payload.sig",
};

const ok = (data: LoginResponse) =>
  HttpResponse.json<ApiResponse<LoginResponse>>(
    { result: "SUCCESS", data, error: null },
    { status: 200 }
  );

const fail = (error: ApiErrorResponse) =>
  HttpResponse.json<ApiResponse<LoginResponse>>(
    { result: "ERROR", data: null, error },
    { status: error.status }
  );

export const handlers = [
  http.post("*/auth/login", async ({ request }) => {
    // Next.js Server Action(예: setAuthToken)은 호출된 페이지 URL로 POST하므로,
    // 로그인 페이지(/auth/login)에서 실행되면 이 목 핸들러의 경로와 우연히 겹친다.
    // Next-Action 헤더가 있으면 서버 액션 요청이므로 목킹하지 않고 그대로 통과시킨다.
    if (request.headers.has("Next-Action")) return passthrough();

    const body = (await request.json()) as LoginRequest;
    await delay(300);

    if (body.email !== VALID.email || body.password !== VALID.password) {
      return fail({
        code: "AUTH_INVALID_CREDENTIALS",
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        status: 401,
      });
    }

    return ok(SUCCESS_DATA);
  }),
];
