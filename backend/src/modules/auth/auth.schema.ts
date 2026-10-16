import { z } from "zod";

// 요청 검증 규칙. 프론트 src/api/constant/AccountField.schema.ts 및
// src/api/domain/auth/**/request/*.ts 와 같은 규칙을 유지한다 (shared 이관 전까지 중복 정의).

export const emailSchema = z.string().min(1).pipe(z.email());

export const passwordSchema = z
  .string()
  .min(8)
  .max(16)
  .regex(/^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/);

export const nicknameSchema = z.string().regex(/^[가-힣a-zA-Z0-9]{2,12}$/);

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  nickname: nicknameSchema,
  termsAgree: z.literal(true),
  privacyAgree: z.literal(true),
  marketingAgree: z.boolean(),
  // 클라이언트가 보내지만 서버는 MEMBER 로만 가입시킨다 (백엔드 명세서 §4.1)
  role: z.enum(["MEMBER", "OWNER", "ADMIN"]),
});
export type SignupRequest = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type LoginRequest = z.infer<typeof loginSchema>;

/** reissue · logout 공통 */
export const refreshJwtSchema = z.object({
  refreshJwt: z.string().min(1),
});
export type RefreshJwtRequest = z.infer<typeof refreshJwtSchema>;

export interface SignupResponse {
  email: string;
}

export interface LoginResponse {
  accessJwt: string;
  refreshJwt: string;
}

export interface ReissueResponse {
  accessJwt: string;
}
