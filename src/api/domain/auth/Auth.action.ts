"use server";

import { cookies } from "next/headers";

const ACCESS_TOKEN_MAX_AGE = 60 * 15; // 15분 (액세스 토큰 만료 정책에 맞춰 조정)
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 14; // 14일

interface SetAuthTokenParams {
  accessToken: string;
  refreshToken: string;
}

/**
 * 클라이언트가 로그인 API 응답으로 받은 토큰을 BFF(Next.js 서버)에
 * httpOnly 쿠키로 저장한다. 브라우저 JS는 토큰 값에 접근할 수 없다.
 */
export async function setAuthToken({
  accessToken,
  refreshToken,
}: SetAuthTokenParams): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  cookieStore.set("refreshToken", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });
}

/** 로그아웃 시 세션 쿠키 삭제 */
export async function clearAuthToken(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
}
