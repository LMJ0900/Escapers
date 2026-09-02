import { z } from "zod";

export const loginRequestSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요.")
    .pipe(z.email("이메일 형식이 올바르지 않습니다.")),
  password: z
    .string()
    .min(8, "비밀번호는 8자 이상 16자 이하여야 합니다.")
    .max(16, "비밀번호는 8자 이상 16자 이하여야 합니다.")
    .regex(
      /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
      "비밀번호는 영문 숫자 특수문자의 조합이어야 합니다.",
    ),
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
