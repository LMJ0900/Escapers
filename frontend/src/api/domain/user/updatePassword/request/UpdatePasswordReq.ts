import { z } from "zod";

import { passwordFieldSchema } from "@/api/constant/AccountField.schema";

export const updatePasswordRequestSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요."),
    newPassword: passwordFieldSchema,
    newPasswordConfirm: z.string().min(1, "비밀번호를 다시 입력해주세요."),
  })
  .superRefine((data, ctx) => {
    if (data.newPassword !== data.newPasswordConfirm) {
      ctx.addIssue({
        code: "custom",
        path: ["newPasswordConfirm"],
        message: "비밀번호가 일치하지 않습니다.",
      });
    }
  });

export type UpdatePasswordFormValues = z.infer<
  typeof updatePasswordRequestSchema
>;

/** 서버로 보내는 실제 payload. newPasswordConfirm 은 클라이언트 검증 전용이라 제외한다. */
export type UpdatePasswordRequest = Omit<
  UpdatePasswordFormValues,
  "newPasswordConfirm"
>;
