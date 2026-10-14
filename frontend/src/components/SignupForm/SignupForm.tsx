"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import type { AuthSignupErrorResponse } from "@/api/domain/auth/Auth.error";
import { AuthMutation } from "@/api/domain/auth/Auth.mutation";
import {
  signupRequestSchema,
  type SignupFormValues,
  type SignupRequest,
} from "@/api/domain/auth/signup/request/SignupReq";
import type { SignupResponse } from "@/api/domain/auth/signup/response/SignupRes";
import type { UserRole } from "@/api/domain/user/getMe/response/getMeRes";
import InputBox from "@/components/InputBox";
import SubmitButton from "@/components/SubmitButton";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./SignupForm.module.css";

const cx = bindClassNames(styles);

type SignupFormProps = {
  /** 가입 유형. 페이지별로 문구·안내·payload 의 role 값을 다르게 가져가기 위한 값. */
  role: Extract<UserRole, "MEMBER" | "OWNER">;
};

export default function SignupForm({ role }: SignupFormProps) {
  const [doneEmail, setDoneEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isValid },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupRequestSchema),
    // 입력이 바뀔 때마다 검증 → 에러 메시지 최신화
    mode: "onChange",
    defaultValues: {
      termsAgree: false,
      privacyAgree: false,
      marketingAgree: false,
    },
  });

  const [
    email,
    password,
    passwordConfirm,
    nickname,
    termsAgree,
    privacyAgree,
    marketingAgree,
  ] = watch([
    "email",
    "password",
    "passwordConfirm",
    "nickname",
    "termsAgree",
    "privacyAgree",
    "marketingAgree",
  ]);

  const allAgreed = Boolean(termsAgree && privacyAgree && marketingAgree);

  const handleAgreeAll = (checked: boolean) => {
    setValue("termsAgree", checked, { shouldValidate: true });
    setValue("privacyAgree", checked, { shouldValidate: true });
    setValue("marketingAgree", checked);
  };

  const {
    mutate: signup,
    isPending,
    error,
  } = useMutation<SignupResponse, AuthSignupErrorResponse, SignupRequest>({
    mutationFn: AuthMutation.postSignup,
    onSuccess: (res) => setDoneEmail(res.email),
    onError: (err) => {
      if (err.code === "AUTH_EMAIL_DUPLICATE") {
        setError("email", { message: err.message });
        return;
      }
      if (err.code === "AUTH_NICKNAME_DUPLICATE") {
        setError("nickname", { message: err.message });
      }
    },
  });

  const isFieldError =
    error?.code === "AUTH_EMAIL_DUPLICATE" ||
    error?.code === "AUTH_NICKNAME_DUPLICATE";

  const onSubmit = (data: SignupFormValues) => {
    signup({
      email: data.email,
      password: data.password,
      nickname: data.nickname,
      termsAgree: data.termsAgree,
      privacyAgree: data.privacyAgree,
      marketingAgree: data.marketingAgree,
      role,
    });
  };

  if (doneEmail) {
    return (
      <div className={cx("done")}>
        <p className={cx("doneTitle")}>가입 신청이 완료됐어요</p>
        <p className={cx("doneDesc")}>
          <strong>{doneEmail}</strong>(으)로 인증 메일을 보냈어요.
          <br />
          메일함에서 인증을 완료하면 로그인할 수 있어요.
        </p>
        <Link href="/auth/login" className={cx("doneLink")}>
          로그인으로 이동
        </Link>
      </div>
    );
  }

  return (
    <form className={cx("form")} onSubmit={handleSubmit(onSubmit)} noValidate>
      <InputBox
        id="email"
        type="email"
        label="이메일"
        autoComplete="email"
        placeholder="you@example.com"
        help="가입 후 인증 메일을 보내드려요"
        error={errors.email?.message}
        {...register("email")}
      />

      <InputBox
        id="password"
        type="password"
        label="비밀번호"
        autoComplete="new-password"
        placeholder="••••••••"
        help="영문·숫자·특수문자 조합 8~16자"
        error={errors.password?.message}
        {...register("password")}
      />

      <InputBox
        id="passwordConfirm"
        type="password"
        label="비밀번호 확인"
        autoComplete="new-password"
        placeholder="••••••••"
        error={errors.passwordConfirm?.message}
        {...register("passwordConfirm")}
      />

      <InputBox
        id="nickname"
        type="text"
        label="닉네임"
        autoComplete="nickname"
        placeholder="탈출의달인"
        help="한글·영문·숫자 2~12자"
        error={errors.nickname?.message}
        {...register("nickname")}
      />

      <div className={cx("agree")}>
        <label className={cx("agreeMaster")}>
          <input
            type="checkbox"
            className={cx("checkbox")}
            checked={allAgreed}
            onChange={(e) => handleAgreeAll(e.target.checked)}
          />
          전체 동의
        </label>

        <label className={cx("agreeRow")}>
          <input
            type="checkbox"
            className={cx("checkbox")}
            {...register("termsAgree")}
          />
          <span className={cx("agreeText")}>
            <span className={cx("required")}>[필수]</span> 이용약관 동의
          </span>
          {/* TODO: 약관 상세 라우트가 정해지면 href 교체 */}
          <Link href="/terms" className={cx("agreeView")}>
            보기
          </Link>
        </label>

        <label className={cx("agreeRow")}>
          <input
            type="checkbox"
            className={cx("checkbox")}
            {...register("privacyAgree")}
          />
          <span className={cx("agreeText")}>
            <span className={cx("required")}>[필수]</span> 개인정보 처리방침
            동의
          </span>
          {/* TODO: 약관 상세 라우트가 정해지면 href 교체 */}
          <Link href="/privacy" className={cx("agreeView")}>
            보기
          </Link>
        </label>

        <label className={cx("agreeRow")}>
          <input
            type="checkbox"
            className={cx("checkbox")}
            {...register("marketingAgree")}
          />
          <span className={cx("agreeText")}>
            <span className={cx("optional")}>[선택]</span> 마케팅 정보 수신 동의
          </span>
          {/* TODO: 약관 상세 라우트가 정해지면 href 교체 */}
          <Link href="/marketing-policy" className={cx("agreeView")}>
            보기
          </Link>
        </label>
      </div>

      {(errors.termsAgree || errors.privacyAgree) && (
        <p className={cx("error")}>필수 약관에 동의해야 가입할 수 있어요.</p>
      )}

      {role === "OWNER" && (
        <p className={cx("notice")}>
          지점·사업자 정보는 가입 후 다음 단계에서 입력해요.
        </p>
      )}

      {error && !isFieldError && <p className={cx("error")}>{error.message}</p>}

      <SubmitButton
        disabled={
          !isValid ||
          !email ||
          !password ||
          !passwordConfirm ||
          !nickname ||
          !termsAgree ||
          !privacyAgree ||
          isPending
        }
      >
        {isPending
          ? "가입 처리 중…"
          : role === "OWNER"
            ? "사장님으로 가입"
            : "회원가입"}
      </SubmitButton>
    </form>
  );
}
