import { z } from "zod";

import type { UserRole } from "@/api/domain/user/getMe/response/getMeRes";

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/;
// LoginReq 와 동일한 정규식(영문+숫자+특수문자 조합)을 재사용한다.
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/;

export const signupRequestSchema = z
  .object({
    email: z
      .string()
      .min(1, "이메일을 입력해주세요.")
      .pipe(z.email("이메일 형식이 올바르지 않습니다.")),
    password: z
      .string()
      .min(8, "비밀번호는 8자 이상 16자 이하여야 합니다.")
      .max(16, "비밀번호는 8자 이상 16자 이하여야 합니다.")
      .regex(
        PASSWORD_REGEX,
        "비밀번호는 영문 숫자 특수문자의 조합이어야 합니다."
      ),
    passwordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요."),
    nickname: z
      .string()
      .min(1, "닉네임을 입력해주세요.")
      .regex(NICKNAME_REGEX, "닉네임은 한글·영문·숫자 2~12자로 입력해주세요."),
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
