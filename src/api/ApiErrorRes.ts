export interface ApiErrorResponse<TCode extends string = string> {
  code: TCode;
  message: string;
  status: number;
  // details?: Record<string, unknown>; // 예정
  // traceId?: string;                   // 예정
}

export const UNKNOWN_ERROR_MESSAGE =
  "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

/**
 * 값이 `error` 객체 형태인지 검사한다.
 * `status` 는 전송 계층 합성 에러가 빠뜨릴 수 있어 느슨하게 본다(있으면 number). (공통 에러 명세서 §7.1)
 */
export function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.code === "string" &&
    typeof v.message === "string" &&
    (v.status === undefined || typeof v.status === "number")
  );
}
