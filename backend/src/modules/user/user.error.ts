import type { ErrorSpec } from "../../common/exception/error-code";

// 회원 도메인 에러 (백엔드 명세서 §4.2, User 에러 명세서 §3). 문구는 MSW 목과 같다.
export const USER_ERROR = {
  NICKNAME_DUPLICATE: {
    code: "USER_NICKNAME_DUPLICATE",
    message: "이미 사용 중인 닉네임이에요.",
    status: 409,
  },
  EMAIL_DUPLICATE: {
    code: "USER_EMAIL_DUPLICATE",
    message: "이미 사용 중인 이메일이에요.",
    status: 409,
  },
  CURRENT_PASSWORD_MISMATCH: {
    code: "USER_CURRENT_PASSWORD_MISMATCH",
    message: "현재 비밀번호가 올바르지 않습니다.",
    status: 401,
  },
} as const satisfies Record<string, ErrorSpec>;
