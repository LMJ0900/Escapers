import { http, HttpResponse, delay, passthrough } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { LoginRequest } from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";
import type { ReissueRequest } from "@/api/domain/auth/reissue/request/ReissueReq";
import type { ReissueResponse } from "@/api/domain/auth/reissue/response/ReissueRes";

const VALID = { email: "mock@test.com", password: "test1234!" };

export const MOCK_ACCESS_JWT = "eyJhbGciOiJIUzI1NiJ9.fake-access-payload.sig";
/** getMe 목 핸들러에서 AUTH_TOKEN_EXPIRED를 재현하기 위한 값. accessToken 쿠키에 수동으로 넣어 테스트한다. */
export const MOCK_EXPIRED_ACCESS_JWT =
  "eyJhbGciOiJIUzI1NiJ9.fake-expired-access-payload.sig";
const MOCK_REFRESH_JWT = "eyJhbGciOiJIUzI1NiJ9.fake-refresh-payload.sig";

const SUCCESS_DATA: LoginResponse = {
  accessJwt: MOCK_ACCESS_JWT,
  refreshJwt: MOCK_REFRESH_JWT,
};

const ok = <TData>(data: TData) =>
  HttpResponse.json<ApiResponse<TData>>(
    { result: "SUCCESS", data, error: null },
    { status: 200 }
  );

const fail = <TData>(error: ApiErrorResponse) =>
  HttpResponse.json<ApiResponse<TData>>(
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
      return fail<LoginResponse>({
        code: "AUTH_INVALID_CREDENTIALS",
        message: "이메일 또는 비밀번호가 올바르지 않습니다.",
        status: 401,
      });
    }

    return ok<LoginResponse>(SUCCESS_DATA);
  }),

  http.post("*/auth/reissue", async ({ request }) => {
    // reissueAccessToken() 도 Server Action이라 /auth/login 과 같은 이유로
    // 현재 페이지 URL로 POST될 수 있다. Next-Action 헤더는 그대로 통과시킨다.
    if (request.headers.has("Next-Action")) return passthrough();

    const body = (await request.json()) as ReissueRequest;
    await delay(300);

    if (body.refreshJwt !== MOCK_REFRESH_JWT) {
      return fail<ReissueResponse>({
        code: "AUTH_TOKEN_INVALID",
        message: "유효하지 않은 인증 토큰입니다.",
        status: 401,
      });
    }

    return ok<ReissueResponse>({ accessJwt: MOCK_ACCESS_JWT });
  }),
];
