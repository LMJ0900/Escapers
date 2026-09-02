import Link from "next/link";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./HeaderActions.module.css";

const cx = bindClassNames(styles);

export default function HeaderActions() {
  return (
    <div className={cx("root")}>
      {/* TODO: 검색 UI 연결 (오버레이 or 검색 페이지) */}
      <button type="button" className={cx("iconButton")} aria-label="검색">
        <SearchIcon />
      </button>

      {/* TODO: 실제 로그인 라우트가 정해지면 href 교체 */}
      <Link href="/login" className={cx("login")}>
        로그인
      </Link>
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
