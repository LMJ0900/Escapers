// 공통 에러 코드 (백엔드 명세서 §3.2, 공통 에러 명세서 §3).
// 도메인 에러 코드는 각 모듈의 *.error.ts 에 둔다.
export const COMMON_ERROR = {
  VALIDATION_FAILED: {
    code: "VALIDATION_FAILED",
    message: "입력값을 다시 확인해주세요.",
    status: 400,
  },
  NOT_FOUND: {
    code: "NOT_FOUND",
    message: "요청한 리소스를 찾을 수 없습니다.",
    status: 404,
  },
  INTERNAL_ERROR: {
    code: "INTERNAL_ERROR",
    message: "일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
    status: 500,
  },
} as const satisfies Record<string, ErrorSpec>;

export interface ErrorSpec {
  code: string;
  message: string;
  status: number;
}
