"use server";

import { cookies } from "next/headers";

import { AuthMutation } from "@/api/domain/auth/Auth.mutation";
import {ACCESS_TOKEN_COOKIE_OPTIONS, REFRESH_TOKEN_COOKIE_OPTIONS,} from "@/constant/token/index";

interface SetAuthTokenParams {
  accessToken: string;
  refreshToken: string;
}

/** 클라이언트가 로그인 API 응답으로 받은 토큰을 쿠키로 저장한다. */
export async function setAuthToken({
  accessToken,
  refreshToken,
}: SetAuthTokenParams): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("accessToken", accessToken, ACCESS_TOKEN_COOKIE_OPTIONS);
  cookieStore.set("refreshToken", refreshToken, REFRESH_TOKEN_COOKIE_OPTIONS);
}

/**
 * 로그아웃 처리: 서버에 refreshToken 폐기를 알린 뒤 세션 쿠키를 삭제한다.
 * refreshToken은 httpOnly라 클라이언트에서 읽을 수 없어 여기(Server Action)에서 처리한다.
 * 서버 통지가 실패해도 클라이언트 세션은 정리해야 하므로 best-effort로 무시한다.
 */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (refreshToken) {
    try {
      await AuthMutation.postLogout({ refreshJwt: refreshToken });
    } catch {
      // 서버측 폐기 실패는 무시하고 로컬 세션 정리를 계속한다.
    }
  }

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}

export async function reissueAccessToken(): Promise<boolean> {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refreshToken")?.value;

  if (!refreshToken) return false;

  try {
    const { accessJwt } = await AuthMutation.postReissue({
      refreshJwt: refreshToken,
    });

    cookieStore.set("accessToken", accessJwt, ACCESS_TOKEN_COOKIE_OPTIONS);
    return true;
  } catch {
    return false;
  }
}
