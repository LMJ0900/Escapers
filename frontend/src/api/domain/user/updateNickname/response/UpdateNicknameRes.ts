import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";

/** 닉네임은 토큰 subject(email)에 영향이 없어 최신 본인 정보만 그대로 내려준다. */
export type UpdateNicknameResponse = getMeResponse;
