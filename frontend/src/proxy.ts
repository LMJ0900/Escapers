import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { AuthMutation } from "@/api/domain/auth/Auth.mutation";
import { ACCESS_TOKEN_COOKIE_OPTIONS } from "@/constant/token";

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("accessToken")?.value;
  const refreshToken = request.cookies.get("refreshToken")?.value;

  if (accessToken || !refreshToken) {
    return NextResponse.next();
  }

  try {
    const { accessJwt } = await AuthMutation.postReissue({
      refreshJwt: refreshToken,
    });

    request.cookies.set("accessToken", accessJwt);

    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.set("accessToken", accessJwt, ACCESS_TOKEN_COOKIE_OPTIONS);
    return response;
  } catch {
    request.cookies.delete("accessToken");
    request.cookies.delete("refreshToken");
    const response = NextResponse.next({
      request: { headers: request.headers },
    });
    response.cookies.delete("accessToken");
    response.cookies.delete("refreshToken");
    return response;
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
