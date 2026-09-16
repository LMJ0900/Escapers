import axios, { type AxiosRequestConfig } from "axios";

import { toMalformedError, toTransportError } from "@/api/ApiClient.error";
import { attachAuthInterceptors } from "@/api/ApiClient.interceptor";
import { isApiErrorResponse } from "@/api/ApiErrorRes";
import { isApiResponse, type ApiResponse } from "@/api/ApiRes";

import { BASE_URL } from "@/constant/environment";

const baseApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 10_000,
});

attachAuthInterceptors(baseApiClient);

interface ApiClientProps {
  urlPath: string;
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  data?: unknown;
  skipAuthHeader?: boolean;
}

/**
 * 서버 응답은 성공/실패 모두 `ApiResponse` 엔벨로프({ result, data, error })로 온다. (공통 에러 명세서 §1)
 * - 성공: 엔벨로프를 벗겨 `data` 만 반환
 * - 실패: `error`(`ApiErrorResponse`)로 reject
 *
 * 호출부는 성공 시 `SuccessData`, 실패 시 항상 `ApiErrorResponse` 한 가지만 다루면 된다.
 */
const apiClient = async <SuccessData = unknown>(
  props: ApiClientProps
): Promise<SuccessData> => {
  const options: AxiosRequestConfig = {
    url: props.urlPath,
    method: props.method,
    ...(props.data !== undefined && { data: props.data }),
    ...(props.skipAuthHeader && { skipAuthHeader: true }),
  };

  try {
    const response =
      await baseApiClient.request<ApiResponse<SuccessData>>(options);
    const body = response.data;

    if (!isApiResponse(body))
      return Promise.reject(toMalformedError(response.status)); // 응답 형태가 맞지 않을 때

    if (body.result === "ERROR") {
      return Promise.reject(
        isApiErrorResponse(body.error)
          ? body.error
          : toMalformedError(response.status)
      );
    }

    return body.data; // 형태는 맞는데 200임에도 비즈니스 로직상 에러일 때
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data;

      if (
        isApiResponse(body) &&
        body.result === "ERROR" &&
        isApiErrorResponse(body.error)
      ) {
        return Promise.reject(body.error); // 응답 정상 형식 정상
      }

      return Promise.reject(toMalformedError(error.response.status)); // 응답은 왔지만 형식 이상
    }

    return Promise.reject(toTransportError(error)); // 응답 자체가 없음 (오프라인 / 타임아웃 / CORS 등)
  }
};

export default apiClient;
