import Link from "next/link";
import type { ReactNode } from "react";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./Header.module.css";

const cx = bindClassNames(styles);

// TODO: 실제 라우트가 정해지면 href 교체
const NAV_ITEMS = [
  { label: "테마", href: "/themes" },
  { label: "이용안내", href: "/guide" },
  { label: "지점", href: "/branches" },
  { label: "리뷰", href: "/reviews" },
];

type HeaderProps = {
  children?: ReactNode;
};

export default function Header({ children }: HeaderProps) {
  return (
    <>
      <header className={cx("root")}>
        <Link href="/" className={cx("logo")}>
          ESCAPERS
        </Link>

        <nav className={cx("nav")}>
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={cx("navLink")}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link href="/reservation" className={cx("cta")}>
          예약하기
        </Link>
      </header>

      {children}
    </>
  );
}
