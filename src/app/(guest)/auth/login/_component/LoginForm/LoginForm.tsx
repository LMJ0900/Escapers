"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import { setAuthToken } from "@/api/domain/auth/Auth.action";
import { AuthMutation } from "@/api/domain/auth/login/Auth.mutation";
import {
  loginRequestSchema,
  type LoginRequest,
} from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";
import InputBox from "@/components/InputBox";
import SubmitButton from "@/components/SubmitButton";
import { bindClassNames } from "@/util/BindClassName";

import SocialLoginForm from "../SocialLoginForm/SocialLoginForm";
import styles from "./LoginForm.module.css";

const cx = bindClassNames(styles);

export default function LoginForm() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    // 입력이 바뀔 때마다 검증 → 에러 메시지 최신화
    mode: "onChange",
  });

  // 입력 상태를 watch 로 감시 (제출 버튼 활성화 등에 사용)
  const [email, password] = watch(["email", "password"]);

  const {
    mutate: login,
    isPending,
    error,
  } = useMutation<LoginResponse, ApiErrorResponse, LoginRequest>({
    mutationFn: AuthMutation.postLogin,
    onSuccess: async (res) => {
      await setAuthToken({
        accessToken: res.accessJwt,
        refreshToken: res.refreshJwt,
      });
      router.push("/");
    },
  });

  const onSubmit = (data: LoginRequest) => login(data);

  return (
    <div className={cx("root")}>
      <SocialLoginForm />

      <div className={cx("divider")}>또는</div>

      <form className={cx("form")} onSubmit={handleSubmit(onSubmit)} noValidate>
        <InputBox
          id="email"
          type="email"
          label="이메일"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email?.message}
          {...register("email")}
        />

        <InputBox
          id="password"
          type="password"
          label="비밀번호"
          autoComplete="current-password"
          placeholder="••••••••"
          error={errors.password?.message}
          {...register("password")}
        />

        <div className={cx("options")}>
          <label className={cx("remember")}>
            <input type="checkbox" name="remember" className={cx("checkbox")} />
            로그인 상태 유지
          </label>

          {/* TODO: 비밀번호 찾기 라우트가 정해지면 href 교체 */}
          <Link href="/find-password" className={cx("forgot")}>
            비밀번호 찾기
          </Link>
        </div>

        {error && <p className={cx("error")}>{error.message}</p>}

        <SubmitButton disabled={!isValid || !email || !password || isPending}>
          {isPending ? "로그인 중…" : "로그인"}
        </SubmitButton>
      </form>
    </div>
  );
}
