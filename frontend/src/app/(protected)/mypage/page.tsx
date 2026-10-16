import type { Metadata } from "next";

import { verifySession } from "@/api/domain/auth/Auth.session";
import { bindClassNames } from "@/util/BindClassName";

import AccountInfo from "./_component/AccountInfo/AccountInfo";
import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "회원정보 · Escapers",
};

export default async function MypagePage() {
  // 레이아웃과 동일한 verifySession 호출이지만 React cache()로 중복 요청되지 않는다.
  const me = await verifySession();

  return (
    <>
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>My Page</span>
        <h1 className={cx("title")}>회원정보</h1>
      </div>

      <AccountInfo initialMe={me} />
    </>
  );
}
