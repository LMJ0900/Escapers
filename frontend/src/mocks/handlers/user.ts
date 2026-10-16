import { http, HttpResponse, delay } from "msw";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { ApiResponse } from "@/api/ApiRes";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import type {
  UpdateEmailErrorCode,
  UpdateNicknameErrorCode,
  UpdatePasswordErrorCode,
  UserAuthErrorCode,
} from "@/api/domain/user/User.error";
import type { UpdateEmailRequest } from "@/api/domain/user/updateEmail/request/UpdateEmailReq";
import type { UpdateEmailResponse } from "@/api/domain/user/updateEmail/response/UpdateEmailRes";
import type { UpdateMarketingAgreeRequest } from "@/api/domain/user/updateMarketingAgree/request/UpdateMarketingAgreeReq";
import type { UpdateNicknameRequest } from "@/api/domain/user/updateNickname/request/UpdateNicknameReq";
import type { UpdateNicknameResponse } from "@/api/domain/user/updateNickname/response/UpdateNicknameRes";
import type { UpdatePasswordRequest } from "@/api/domain/user/updatePassword/request/UpdatePasswordReq";

import { MOCK_EXPIRED_ACCESS_JWT } from "@/mocks/handlers/auth";
import { accountStore, type MockAccount } from "@/mocks/state/accountStore";
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

const toMeResponse = (account: MockAccount): getMeResponse => ({
  id: account.id,
  role: account.role,
  email: account.email,
  nickname: account.nickname,
  marketingAgree: account.marketingAgree,
});

/** 모든 /user/* 목 핸들러가 공유하는 인증 단계. 실패 시 §2.2 공통 인증 에러를 던진다. */
function authenticate(
  request: Request
): { account: MockAccount } | { error: ApiErrorResponse<UserAuthErrorCode> } {
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

  if (account.status === "SUSPENDED") {
    return {
      error: {
        code: "AUTH_ACCOUNT_SUSPENDED",
        message: "이용이 제한된 계정입니다. 고객센터로 문의해주세요.",
        status: 403,
      },
    };
  }

  if (account.status === "WITHDRAWN") {
    return {
      error: {
        code: "AUTH_ACCOUNT_WITHDRAWN",
        message: "탈퇴한 계정입니다.",
        status: 403,
      },
    };
  }

  return { account };
}

export const handlers = [
  http.get("*/user/getMe", async ({ request }) => {
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail<getMeResponse>(auth.error);

    return ok(toMeResponse(auth.account));
  }),

  http.patch("*/user/nickname", async ({ request }) => {
    const body = (await request.json()) as UpdateNicknameRequest;
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail<UpdateNicknameResponse>(auth.error);
    const { account } = auth;

    if (body.nickname === account.nickname) {
      return ok<UpdateNicknameResponse>(toMeResponse(account));
    }

    if (accountStore.existsByNicknameExcept(body.nickname, account.email)) {
      return fail<UpdateNicknameResponse>({
        code: "USER_NICKNAME_DUPLICATE" satisfies UpdateNicknameErrorCode,
        message: "이미 사용 중인 닉네임이에요.",
        status: 409,
      });
    }

    const updated = accountStore.updateNickname(account.email, body.nickname);
    return ok<UpdateNicknameResponse>(toMeResponse(updated!));
  }),

  http.patch("*/user/email", async ({ request }) => {
    const body = (await request.json()) as UpdateEmailRequest;
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail<UpdateEmailResponse>(auth.error);
    const { account } = auth;

    if (body.email !== account.email && accountStore.findByEmail(body.email)) {
      return fail<UpdateEmailResponse>({
        code: "USER_EMAIL_DUPLICATE" satisfies UpdateEmailErrorCode,
        message: "이미 사용 중인 이메일이에요.",
        status: 409,
      });
    }

    if (body.email !== account.email) {
      accountStore.updateEmail(account.email, body.email);
    }

    // 이메일이 바뀌면 기존 토큰의 subject가 더 이상 유효하지 않으므로 토큰을 재발급하지
    // 않는다 — 호출부가 세션을 정리하고 새 이메일로 다시 로그인하게 한다.
    return ok<UpdateEmailResponse>({ email: body.email });
  }),

  http.patch("*/user/password", async ({ request }) => {
    const body = (await request.json()) as UpdatePasswordRequest;
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail(auth.error);
    const { account } = auth;

    if (!accountStore.verifyPassword(account.email, body.currentPassword)) {
      return fail({
        code: "USER_CURRENT_PASSWORD_MISMATCH" satisfies UpdatePasswordErrorCode,
        message: "현재 비밀번호가 올바르지 않습니다.",
        status: 401,
      });
    }

    accountStore.updatePassword(account.email, body.newPassword);
    return ok<null>(null);
  }),

  http.patch("*/user/marketing-agree", async ({ request }) => {
    const body = (await request.json()) as UpdateMarketingAgreeRequest;
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail<getMeResponse>(auth.error);
    const { account } = auth;

    const updated = accountStore.updateMarketingAgree(
      account.email,
      body.marketingAgree
    );
    return ok(toMeResponse(updated!));
  }),

  http.delete("*/user/me", async ({ request }) => {
    await delay(300);

    const auth = authenticate(request);
    if ("error" in auth) return fail(auth.error);

    accountStore.remove(auth.account.email);
    return ok<null>(null);
  }),
];
