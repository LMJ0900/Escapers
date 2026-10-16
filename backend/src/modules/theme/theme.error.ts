import type { ErrorSpec } from "../../common/exception/error-code";

// 테마 도메인 에러 (백엔드 명세서 §4.3). 문구는 MSW 목과 같다.
export const THEME_ERROR = {
  NOT_FOUND: {
    code: "THEME_NOT_FOUND",
    message: "존재하지 않는 테마입니다.",
    status: 404,
  },
  COLLECTION_NOT_FOUND: {
    code: "THEME_COLLECTION_NOT_FOUND",
    message: "존재하지 않는 테마 묶음입니다.",
    status: 404,
  },
} as const satisfies Record<string, ErrorSpec>;
