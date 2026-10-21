import Link from "next/link";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./not-found.module.css";

const cx = bindClassNames(styles);

export default function ThemeNotFound() {
  return (
    <div className={cx("root")}>
      <h1 className={cx("title")}>테마를 찾을 수 없어요</h1>
      <p className={cx("description")}>
        주소가 바뀌었거나 더 이상 운영하지 않는 테마일 수 있어요.
      </p>
      <Link href="/themes" className={cx("link")}>
        모든 테마 보기
      </Link>
    </div>
  );
}
