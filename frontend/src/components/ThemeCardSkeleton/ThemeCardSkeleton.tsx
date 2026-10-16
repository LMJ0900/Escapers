import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThemeCardSkeleton.module.css";

const cx = bindClassNames(styles);

/** 테마 카드(ThemeCard) 로딩 자리표시자. 썸네일 비율은 ThemeCard와 같은 4:3이다. */
export default function ThemeCardSkeleton() {
  return (
    <div className={cx("card")} aria-hidden>
      <div className={cx("thumb")} />
      <div className={cx("line")} style={{ width: "70%" }} />
      <div className={cx("line")} style={{ width: "45%" }} />
    </div>
  );
}
