import { z } from "zod";
import type { UserRole } from "../../generated/prisma/enums";
import {
  emailSchema,
  nicknameSchema,
  passwordSchema,
} from "../auth/auth.schema";

// 요청 검증 규칙. 프론트 src/api/domain/user/**/request/*.ts 와 같은 규칙을 유지한다 (shared 이관 전까지 중복 정의).

export const updateNicknameSchema = z.object({
  nickname: nicknameSchema,
});
export type UpdateNicknameRequest = z.infer<typeof updateNicknameSchema>;

export const updateEmailSchema = z.object({
  email: emailSchema,
});
export type UpdateEmailRequest = z.infer<typeof updateEmailSchema>;

export const updatePasswordSchema = z.object({
  // 현재 비밀번호는 규칙이 바뀌기 전에 만든 값일 수 있어 형식은 검사하지 않는다 (프론트도 min(1))
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
export type UpdatePasswordRequest = z.infer<typeof updatePasswordSchema>;

export const updateMarketingAgreeSchema = z.object({
  marketingAgree: z.boolean(),
});
export type UpdateMarketingAgreeRequest = z.infer<
  typeof updateMarketingAgreeSchema
>;

export interface MeResponse {
  id: string;
  role: UserRole;
  email: string;
  nickname: string;
  marketingAgree: boolean;
}

export interface UpdateEmailResponse {
  email: string;
}
