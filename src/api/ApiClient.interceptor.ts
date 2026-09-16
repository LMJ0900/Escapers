import axios, {
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

import {
  getClientAccessToken,
  getServerAccessToken,
} from "@/api/ApiClient.util";
import { isApiResponse } from "@/api/ApiRes";

declare module "axios" {
  export interface AxiosRequestConfig {
    skipAuthHeader?: boolean;
  }
}

interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let reissuePromise: Promise<boolean> | null = null;

export const attachAuthInterceptors = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(async (request) => {
    if (request.skipAuthHeader) return request;
    const accessToken =
      typeof window === "undefined"
        ? await getServerAccessToken()
        : getClientAccessToken();

    if (accessToken)
      request.headers.set("Authorization", `Bearer ${accessToken}`);

    return request;
  });

  /**
   * 클라이언트에서 accessToken 만료(401)를 맞으면 refreshToken으로 재발급을 시도하고,
   * 성공하면 원래 요청을 1회만 재시도한다. refreshToken은 httpOnly라 재발급 자체는
   * Server Action(reissueAccessToken)만 할 수 있어 동적 import로 가져온다 — 이 모듈이
   * 정적으로 Auth.action.ts를 참조하면 Auth.action.ts → Auth.mutation.ts →
   * 이 모듈로 순환 참조가 생기기 때문이다(ApiClient.util.ts의 서버 전용 import 패턴과 동일).
   * 서버(SSR)에서 발생한 401은 이 로직을 타지 않는다 — verifySession이 별도로 처리한다.
   */
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (typeof window === "undefined" || !axios.isAxiosError(error)) {
        return Promise.reject(error);
      }

      const originalRequest = error.config as RetryableRequestConfig | undefined;
      const responseBody = error.response?.data;
      // AUTH_TOKEN_INVALID(서명 위조 · 다른 서비스 토큰 등)는 재발급으로 해결될 문제가
      // 아니므로 재시도하지 않는다. 오직 만료(AUTH_TOKEN_EXPIRED)일 때만 재발급한다.
      const errorCode =
        isApiResponse(responseBody) && responseBody.result === "ERROR"
          ? responseBody.error.code
          : undefined;

      if (
        error.response?.status !== 401 ||
        errorCode !== "AUTH_TOKEN_EXPIRED" ||
        !originalRequest ||
        originalRequest._retry
      ) {
        return Promise.reject(error);
      }

      reissuePromise ??= import("@/api/domain/auth/Auth.action")
        .then(({ reissueAccessToken }) => reissueAccessToken())
        .finally(() => {
          reissuePromise = null;
        });

      const reissued = await reissuePromise;

      if (!reissued) {
        // 이 모듈은 React 컴포넌트가 아니라 useRouter()를 쓸 수 없고, 강제 로그아웃은
        // react-query 캐시 등 클라이언트 상태를 통째로 비워야 해서 하드 네비게이션이 적합하다.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = "/auth/logout?reason=expired";
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      return instance(originalRequest);
    }
  );
};
