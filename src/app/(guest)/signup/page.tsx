import Link from "next/link";
import type { Metadata } from "next";
import { HiOutlineBuildingStorefront, HiOutlineTicket } from "react-icons/hi2";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "회원가입 · Escapers",
};

export default function SignupPage() {
  return (
    <main className={cx("root")}>
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>Sign up</span>
        <h1 className={cx("title")}>회원가입</h1>
        <p className={cx("description")}>어떤 방식으로 가입하시겠어요?</p>
      </div>

      <div className={cx("cards")}>
        <Link href="/signup/member" className={cx("card")}>
          <HiOutlineTicket size={30} aria-hidden />
          <span className={cx("cardTitle")}>일반 회원</span>
          <span className={cx("cardDesc")}>
            테마를 예약하고 방탈출을 즐겨요
          </span>
          <span className={cx("cardCta")}>회원으로 가입 →</span>
        </Link>

        <Link href="/signup/owner" className={cx("card")}>
          <HiOutlineBuildingStorefront size={30} aria-hidden />
          <span className={cx("cardTitle")}>테마 사장님</span>
          <span className={cx("cardDesc")}>
            지점과 테마를 등록하고 운영해요
          </span>
          <span className={cx("cardCta")}>사장님으로 가입 →</span>
        </Link>
      </div>

      <p className={cx("login")}>
        이미 계정이 있으신가요?{" "}
        <Link href="/auth/login" className={cx("loginLink")}>
          로그인
        </Link>
      </p>
    </main>
  );
}
