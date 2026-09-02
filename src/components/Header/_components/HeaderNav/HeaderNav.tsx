import Link from "next/link";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./HeaderNav.module.css";

const cx = bindClassNames(styles);

// TODO: 실제 라우트가 정해지면 href 교체
const NAV_ITEMS = [
  { label: "테마", href: "/themes" },
  { label: "이용안내", href: "/guide" },
  { label: "지점", href: "/branches" },
  { label: "리뷰", href: "/reviews" },
];

export default function HeaderNav() {
  return (
    <nav className={cx("root")}>
      {NAV_ITEMS.map((item) => (
        <Link key={item.href} href={item.href} className={cx("link")}>
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
