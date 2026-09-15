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

export const verifySession = cache(async (): Promise<getMeResponse> => {
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
