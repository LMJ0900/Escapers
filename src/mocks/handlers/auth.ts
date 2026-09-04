import { http, HttpResponse, delay } from "msw";

import type { LoginRequest } from "@/api/domain/auth/request/LoginRes";
import type { LoginResponse } from "@/api/domain/auth/response/LoginRes";

const VALID = { email: "mock@test.com", password: "test1234!" };

const SUCCESS: LoginResponse = {
  accessJwt: "eyJhbGciOiJIUzI1NiJ9.fake-access-payload.sig",
  refreshJwt: "eyJhbGciOiJIUzI1NiJ9.fake-refresh-payload.sig",
};

export const handlers = [
  http.post("*/auth/login", async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    await delay(300);

    if (body.email !== VALID.email || body.password !== VALID.password) {
      return HttpResponse.json(
        {
          result: "ERROR",
          data: null,
          error: {
            code: "AUTH_INVALID_CREDENTIALS",
            message: "이메일 또는 비밀번호가 올바르지 않습니다.",
            status: 401,
          },
        },
        { status: 401 }
      );
    }
    return HttpResponse.json(
      { result: "SUCCESS", data: SUCCESS, error: null },
      { status: 200 }
    );
  }),
];
