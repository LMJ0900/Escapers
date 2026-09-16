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

/** 로그아웃 시 세션 쿠키 삭제 */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();

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
