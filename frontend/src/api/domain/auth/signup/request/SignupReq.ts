import { z } from "zod";

import {
  emailFieldSchema,
  nicknameFieldSchema,
  passwordFieldSchema,
} from "@/api/constant/AccountField.schema";
import type { UserRole } from "@/api/domain/user/getMe/response/getMeRes";

export const signupRequestSchema = z
  .object({
    email: emailFieldSchema,
    password: passwordFieldSchema,
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요."),
    nickname: nicknameFieldSchema,
    termsAgree: z
      .boolean()
      .refine((value) => value === true, "이용약관에 동의해주세요."),
    privacyAgree: z
      .boolean()
      .refine((value) => value === true, "개인정보 처리방침에 동의해주세요."),
    marketingAgree: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.passwordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["passwordConfirm"],
        message: "비밀번호가 일치하지 않습니다.",
      });
    }
  });

export type SignupFormValues = z.infer<typeof signupRequestSchema>;

/** 서버로 보내는 실제 payload. passwordConfirm 은 클라이언트 검증 전용이라 제외하고 role 을 더한다. */
export type SignupRequest = Omit<SignupFormValues, "passwordConfirm"> & {
  role: UserRole;
};
