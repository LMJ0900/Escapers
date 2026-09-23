import { z } from "zod";

/** 로그인/회원가입/이메일 변경에서 공통으로 쓰는 이메일 필드 규칙. */
export const emailFieldSchema = z
  .string()
  .min(1, "이메일을 입력해주세요.")
  .pipe(z.email("이메일 형식이 올바르지 않습니다."));

/** 로그인/회원가입/비밀번호 변경에서 공통으로 쓰는 비밀번호 필드 규칙. */
export const passwordFieldSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상 16자 이하여야 합니다.")
  .max(16, "비밀번호는 8자 이상 16자 이하여야 합니다.")
  .regex(
    /^(?=.*[A-Za-z])(?=.*[0-9])(?=.*[^A-Za-z0-9]).+$/,
    "비밀번호는 영문 숫자 특수문자의 조합이어야 합니다."
  );

/** 회원가입/닉네임 변경에서 공통으로 쓰는 닉네임 필드 규칙. */
export const nicknameFieldSchema = z
  .string()
  .min(1, "닉네임을 입력해주세요.")
  .regex(/^[가-힣a-zA-Z0-9]{2,12}$/, "닉네임은 한글·영문·숫자 2~12자로 입력해주세요.");
