import Link from "next/link";
import type { Metadata } from "next";

import SignupForm from "@/components/SignupForm";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "일반 회원가입 · Escapers",
};

export default function MemberSignupPage() {
  return (
    <main className={cx("root")}>
      <section className={cx("panel")}>
        <div className={cx("heading")}>
          <span className={cx("eyebrow")}>Members</span>
          <h1 className={cx("title")}>회원가입</h1>
          <p className={cx("description")}>
            예약과 기록을 관리할 계정을 만들어요
          </p>
        </div>

        <SignupForm role="MEMBER" />
      </section>

      <div className={cx("links")}>
        <p className={cx("link")}>
          이미 계정이 있으신가요?{" "}
          <Link href="/auth/login" className={cx("linkAnchor")}>
            로그인
          </Link>
        </p>
        <p className={cx("link")}>
          사장님이신가요?{" "}
          <Link href="/signup/owner" className={cx("linkAnchor")}>
            사장님으로 가입
          </Link>
        </p>
      </div>
    </main>
  );
}
