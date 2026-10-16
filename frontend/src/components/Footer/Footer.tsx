import Link from "next/link";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./Footer.module.css";

const cx = bindClassNames(styles);

const INFO_ITEMS = [
  { label: "프로젝트", value: "이스케이퍼스" },
  {
    label: "Email",
    value: "lmjcode0930@naver.com",
  },
  {
    label: "Git",
    value: "github.com/LMJ0900/Escapers",
    href: "https://github.com/LMJ0900/Escapers",
    external: true,
  },
  {
    label: "진행 상황 정리",
    value: "진행상황 노션 문서 바로가기",
    href: "https://app.notion.com/p/3cb702465db980fc8149f76433d9d8e6",
    external: true,
  },
];

export default function Footer() {
  return (
    <footer className={cx("root")}>
      <span className={cx("logo")}>ESCAPERS</span>

      <dl className={cx("info")}>
        {INFO_ITEMS.map((item) => (
          <div key={item.label} className={cx("row")}>
            <dt className={cx("label")}>{item.label}</dt>
            <dd className={cx("value")}>
              {item.href ? (
                <Link
                  href={item.href}
                  className={cx("link")}
                  {...(item.external
                    ? { target: "_blank", rel: "noreferrer noopener" }
                    : {})}
                >
                  {item.value}
                </Link>
              ) : (
                item.value
              )}
            </dd>
          </div>
        ))}
      </dl>

      <p className={cx("copyright")}>
        © {new Date().getFullYear()} Escapers. All rights reserved.
      </p>
    </footer>
  );
}
