import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";

/** 회원 등급 표시 문구 */
export const ROLE_LABEL: Record<getMeResponse["role"], string> = {
  MEMBER: "일반 회원",
  OWNER: "사장님",
  ADMIN: "관리자",
};
