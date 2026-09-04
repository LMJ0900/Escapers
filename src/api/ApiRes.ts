import type { ApiErrorResponse } from "./ApiErrorRes";


export type ApiResponse<TData = null> =
  | { result: "SUCCESS"; data: TData; error: null }
  | { result: "ERROR"; data: null; error: ApiErrorResponse };

/** 값이 응답 엔벨로프 형태인지 검사한다. */
export function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return v.result === "SUCCESS" || v.result === "ERROR";
}
