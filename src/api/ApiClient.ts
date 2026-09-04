import axios, { type AxiosRequestConfig } from "axios";

import {
  getClientAccessToken,
  getServerAccessToken,
} from "@/api/ApiClient.util";
import {
  isApiErrorResponse,
  UNKNOWN_ERROR_MESSAGE,
  type ApiErrorResponse,
} from "@/api/ApiErrorRes";
import { isApiResponse, type ApiResponse } from "@/api/ApiRes";

import { BASE_URL } from "@/constant/environment";

const baseApiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  timeout: 10_000,
});

baseApiClient.interceptors.request.use(async (request) => {
  const accessToken =
    typeof window === "undefined"
      ? await getServerAccessToken()
      : getClientAccessToken();

  if (accessToken)
    request.headers.set("Authorization", `Bearer ${accessToken}`);

  return request;
});

interface ApiClientProps {
  urlPath: string;
  method: "GET" | "POST" | "DELETE" | "PATCH" | "PUT";
  data?: unknown;
}

/**
 * 응답이 오지 않은(전송 계층) 에러를 `error` 객체 형태로 맞춘다. (공통 에러 명세서 §6)
 * 서버 본문이 없으므로 `status` 는 0 으로 채운다.
 */
const toTransportError = (error: unknown): ApiErrorResponse => {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return {
      code: "NETWORK_OFFLINE",
      message: "인터넷 연결을 확인해주세요.",
      status: 0,
    };
  }

  if (axios.isAxiosError(error) && error.code === "ECONNABORTED") {
    return {
      code: "NETWORK_TIMEOUT",
      message: "응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.",
      status: 0,
    };
  }

  if (axios.isAxiosError(error)) {
    return {
      code: "NETWORK_ERROR",
      message: "네트워크 연결에 문제가 있습니다.",
      status: 0,
    };
  }

  return { code: "INTERNAL_ERROR", message: UNKNOWN_ERROR_MESSAGE, status: 0 };
};

/** 응답은 왔지만 엔벨로프 형식이 아닐 때. (공통 에러 명세서 §8-4) */
const toMalformedError = (status: number): ApiErrorResponse => ({
  code: "INVALID_RESPONSE",
  message: UNKNOWN_ERROR_MESSAGE,
  status,
});

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
        return Promise.reject(body.error);  // 응답 정상 형식 정상
      }

      return Promise.reject(toMalformedError(error.response.status)); // 응답은 왔지만 형식 이상
    }

    
    return Promise.reject(toTransportError(error)); // 응답 자체가 없음 (오프라인 / 타임아웃 / CORS 등)
  }
};

export default apiClient;
