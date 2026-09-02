"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useForm } from "react-hook-form";

import {
  loginRequestSchema,
  type LoginRequest,
} from "@/api/domain/auth/request/LoginReq";
import InputBox from "@/components/InputBox";
import SubmitButton from "@/components/SubmitButton";
import { bindClassNames } from "@/util/BindClassName";

import SocialLoginForm from "../SocialLoginForm/SocialLoginForm";
import styles from "./LoginForm.module.css";

const cx = bindClassNames(styles);

export default function LoginForm() {
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

  // TODO: 로그인 API(useMutation) 연결
  const onSubmit = (data: LoginRequest) => {
    console.log(data);
  };

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

        <SubmitButton disabled={!isValid || !email || !password}>
          로그인
        </SubmitButton>
      </form>
    </div>
  );
}
