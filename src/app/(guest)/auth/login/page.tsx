import Link from "next/link";
import type { Metadata } from "next";

import { bindClassNames } from "@/util/BindClassName";

import LoginForm from "./_component/LoginForm/LoginForm";
import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "로그인 · Escapers",
};

export default function LoginPage() {
  return (
    <main className={cx("root")}>
      <section className={cx("panel")}>
        <div className={cx("heading")}>
          <span className={cx("eyebrow")}>Members</span>
          <h1 className={cx("title")}>로그인</h1>
        </div>

        <LoginForm />
      </section>

      <p className={cx("signup")}>
        아직 회원이 아니신가요?{" "}
        <Link href="/auth/signup" className={cx("signupLink")}>
          회원가입
        </Link>
      </p>
    </main>
  );
}
