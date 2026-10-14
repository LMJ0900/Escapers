import type { ErrorSpec } from "../exception/error-code";

/** 응답 엔벨로프 (공통 에러 명세서 §1). 프론트 src/api/ApiRes.ts 와 같은 형태. */
export type ApiResponse<TData = null> =
  | { result: "SUCCESS"; data: TData; error: null }
  | { result: "ERROR"; data: null; error: ErrorSpec };
