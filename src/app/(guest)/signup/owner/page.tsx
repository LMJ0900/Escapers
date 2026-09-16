import Link from "next/link";
import type { Metadata } from "next";

import SignupForm from "@/components/SignupForm";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "사장님 회원가입 · Escapers",
};

export default function OwnerSignupPage() {
  return (
    <main className={cx("root")}>
      <section className={cx("panel")}>
        <div className={cx("heading")}>
          <span className={cx("eyebrow")}>Partners</span>
          <h1 className={cx("title")}>사장님으로 가입</h1>
          <p className={cx("description")}>
            테마 등록과 예약 관리를 위한 사장님 전용 계정이에요
          </p>
        </div>

        <SignupForm role="OWNER" />
      </section>

      <div className={cx("links")}>
        <p className={cx("link")}>
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className={cx("linkAnchor")}>
            로그인
          </Link>
        </p>
        <p className={cx("link")}>
          일반 회원이신가요?{" "}
          <Link href="/signup/member" className={cx("linkAnchor")}>
            일반 회원으로 가입
          </Link>
        </p>
      </div>
    </main>
  );
}
