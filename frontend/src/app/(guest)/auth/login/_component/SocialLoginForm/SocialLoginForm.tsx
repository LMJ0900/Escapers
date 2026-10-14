"use client";

import { FcGoogle } from "react-icons/fc";
import { SiKakaotalk, SiNaver } from "react-icons/si";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./SocialLoginForm.module.css";

const cx = bindClassNames(styles);

type SocialProvider = "google" | "kakao" | "naver";

export default function SocialLoginForm() {
  // TODO: 소셜 로그인 연동 (각 제공자 OAuth 리다이렉트)
  const handleSocialLogin = (provider: SocialProvider) => {
    console.warn(`${provider} 로그인은 아직 연동되지 않았습니다.`);
  };

  return (
    <div className={cx("root")}>
      <button
        type="button"
        className={cx("button", "google")}
        onClick={() => handleSocialLogin("google")}
      >
        <FcGoogle size={16} aria-hidden />
        구글로 시작하기
      </button>

      <button
        type="button"
        className={cx("button", "kakao")}
        onClick={() => handleSocialLogin("kakao")}
      >
        <SiKakaotalk size={16} aria-hidden />
        카카오로 시작하기
      </button>

      <button
        type="button"
        className={cx("button", "naver")}
        onClick={() => handleSocialLogin("naver")}
      >
        <SiNaver size={12} aria-hidden />
        네이버로 시작하기
      </button>
    </div>
  );
}
