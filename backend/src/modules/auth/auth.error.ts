import type { ErrorSpec } from "../../common/exception/error-code";

// 인증 도메인 에러 (백엔드 명세서 §4.1, 로그인 에러 명세서 §4). 문구는 MSW 목과 같다.
export const AUTH_ERROR = {
  EMAIL_DUPLICATE: {
    code: "AUTH_EMAIL_DUPLICATE",
    message: "이미 사용 중인 이메일이에요.",
    status: 409,
  },
  NICKNAME_DUPLICATE: {
    code: "AUTH_NICKNAME_DUPLICATE",
    message: "이미 사용 중인 닉네임이에요.",
    status: 409,
  },
  INVALID_CREDENTIALS: {
    code: "AUTH_INVALID_CREDENTIALS",
    message: "이메일 또는 비밀번호가 올바르지 않습니다.",
    status: 401,
  },
  ACCOUNT_SUSPENDED: {
    code: "AUTH_ACCOUNT_SUSPENDED",
    message: "이용이 제한된 계정입니다. 자세한 내용은 고객센터로 문의해주세요.",
    status: 403,
  },
  ACCOUNT_WITHDRAWN: {
    code: "AUTH_ACCOUNT_WITHDRAWN",
    message: "탈퇴한 계정입니다.",
    status: 403,
  },
  TOKEN_MISSING: {
    code: "AUTH_TOKEN_MISSING",
    message: "로그인이 필요합니다.",
    status: 401,
  },
  TOKEN_INVALID: {
    code: "AUTH_TOKEN_INVALID",
    message: "유효하지 않은 인증 토큰입니다.",
    status: 401,
  },
  TOKEN_EXPIRED: {
    code: "AUTH_TOKEN_EXPIRED",
    message: "인증이 만료되었습니다. 다시 로그인해주세요.",
    status: 401,
  },
} as const satisfies Record<string, ErrorSpec>;
