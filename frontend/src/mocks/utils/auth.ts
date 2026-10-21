import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { UserAuthErrorCode } from "@/api/domain/user/User.error";

import { accountStore, type MockAccount } from "@/mocks/state/accountStore";
import {
  getEmailFromToken,
  MOCK_EXPIRED_ACCESS_JWT,
} from "@/mocks/state/token";

/** §2.2 공통 인증 에러. 로그인이 필요한 목 핸들러가 공유한다. */
const AUTH_ERRORS = {
  missing: {
    code: "AUTH_TOKEN_MISSING",
    message: "인증 토큰이 없습니다.",
    status: 401,
  },
  expired: {
    code: "AUTH_TOKEN_EXPIRED",
    message: "인증 토큰이 만료되었습니다.",
    status: 401,
  },
  invalid: {
    code: "AUTH_TOKEN_INVALID",
    message: "유효하지 않은 인증 토큰입니다.",
    status: 401,
  },
  suspended: {
    code: "AUTH_ACCOUNT_SUSPENDED",
    message: "이용이 제한된 계정입니다. 고객센터로 문의해주세요.",
    status: 403,
  },
  withdrawn: {
    code: "AUTH_ACCOUNT_WITHDRAWN",
    message: "탈퇴한 계정입니다.",
    status: 403,
  },
} as const satisfies Record<string, ApiErrorResponse<UserAuthErrorCode>>;

/** `Authorization: Bearer <token>` 헤더에서 토큰만 꺼낸다. 없으면 null. */
function getBearerToken(request: Request): string | null {
  const authHeader = request.headers.get("Authorization");
  return authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
}

type AuthenticateResult =
  { account: MockAccount } | { error: ApiErrorResponse<UserAuthErrorCode> };

/**
 * 로그인이 필수인 핸들러가 공유하는 인증 단계. 실패 시 §2.2 공통 인증 에러를 돌려준다.
 * `checkAccountStatus` 를 켜면 정지·탈퇴 계정도 403 으로 막는다(/user/* 핸들러).
 */
export function authenticate(
  request: Request,
  { checkAccountStatus = false }: { checkAccountStatus?: boolean } = {}
): AuthenticateResult {
  const token = getBearerToken(request);

  if (!token) return { error: AUTH_ERRORS.missing };
  if (token === MOCK_EXPIRED_ACCESS_JWT) return { error: AUTH_ERRORS.expired };

  const email = getEmailFromToken(token);
  const account = email ? accountStore.findByEmail(email) : undefined;

  if (!account) return { error: AUTH_ERRORS.invalid };

  if (checkAccountStatus) {
    if (account.status === "SUSPENDED") return { error: AUTH_ERRORS.suspended };
    if (account.status === "WITHDRAWN") return { error: AUTH_ERRORS.withdrawn };
  }

  return { account };
}

/** Authorization 헤더가 있으면 계정을 찾아 반환하고, 없거나 유효하지 않으면 null(비로그인 취급). */
export function findAccountFromRequest(request: Request): MockAccount | null {
  const auth = authenticate(request);
  return "account" in auth ? auth.account : null;
}
