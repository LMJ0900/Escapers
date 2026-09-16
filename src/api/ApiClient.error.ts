import axios from "axios";

import { UNKNOWN_ERROR_MESSAGE, type ApiErrorResponse } from "@/api/ApiErrorRes";

/**
 * 응답이 오지 않은(전송 계층) 에러를 `error` 객체 형태로 맞춘다. (공통 에러 명세서 §6)
 * 서버 본문이 없으므로 `status` 는 0 으로 채운다.
 */
export const toTransportError = (error: unknown): ApiErrorResponse => {
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
export const toMalformedError = (status: number): ApiErrorResponse => ({
  code: "INVALID_RESPONSE",
  message: UNKNOWN_ERROR_MESSAGE,
  status,
});
