import Link from "next/link";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./Logo.module.css";

const cx = bindClassNames(styles);

export default function Logo() {
  return (
    <Link href="/" className={cx("root")}>
      ESCAPERS
    </Link>
  );
}
