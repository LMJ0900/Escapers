import type { ErrorSpec } from "./error-code";

/** 응답 엔벨로프의 error 객체로 그대로 변환되는 비즈니스 예외. */
export class AppException extends Error {
  readonly code: string;
  readonly status: number;

  constructor(spec: ErrorSpec) {
    super(spec.message);
    this.name = "AppException";
    this.code = spec.code;
    this.status = spec.status;
  }
}
