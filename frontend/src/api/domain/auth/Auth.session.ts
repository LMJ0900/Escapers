import { cache } from "react";
import { redirect } from "next/navigation";

import { getServerRefreshToken } from "@/api/ApiClient.util";
import { isApiErrorResponse } from "@/api/ApiErrorRes";
import { UserQuery } from "@/api/domain/user/User.query";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";

export interface AuthToken {
  isLoggedIn: boolean;
}

export async function getAuthSession(): Promise<AuthToken> {
  const refreshToken = await getServerRefreshToken();

  return { isLoggedIn: refreshToken !== null };
}

const AUTH_LOGOUT_REASON_BY_CODE: Record<string, string> = {
  AUTH_ACCOUNT_SUSPENDED: "suspended",
  AUTH_ACCOUNT_WITHDRAWN: "withdrawn",
};

const FORCE_LOGOUT_PATH = "/auth/logout";

/**
 * 헤더처럼 모든 페이지에서 공통으로 쓰이는 컴포넌트용.
 * `verifySession` 과 달리 실패를 강제 로그아웃으로 처리하지 않고
 * 조용히 `null` 로 흘려보낸다(비로그인 상태와 동일하게 취급).
 */
export const getOptionalSession = cache(
  async (): Promise<getMeResponse | null> => {
    try {
      return await UserQuery.getMe();
    } catch {
      return null;
    }
  }
);

export const verifySession = cache(async (): Promise<getMeResponse> => {
  const refreshToken = await getServerRefreshToken();

  if (refreshToken === null) {
    redirect("/auth/login?reason=required");
  }

  try {
    return await UserQuery.getMe();
  } catch (err) {
    if (isApiErrorResponse(err)) {
      const reason = AUTH_LOGOUT_REASON_BY_CODE[err.code];
      const shouldForceLogout = reason !== undefined || err.status === 401;

      if (shouldForceLogout) {
        redirect(
          reason ? `${FORCE_LOGOUT_PATH}?reason=${reason}` : FORCE_LOGOUT_PATH
        );
      }
    }

    throw err; // 5xx/네트워크 오류는 로그아웃이 아니라 에러 바운더리로
  }
});
