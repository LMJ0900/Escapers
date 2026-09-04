import { http, HttpResponse, delay } from "msw";

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
