import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./CarouselHeader.module.css";

const cx = bindClassNames(styles);

type CarouselHeaderProps = {
  /** 제목 위에 작게 표시되는 영문 문구 */
  eyebrow: string;
  title: string;
};

export default function CarouselHeader({ eyebrow, title }: CarouselHeaderProps) {
  return (
    <div className={cx("headerRow")}>
      <div className={cx("headingGroup")}>
        <span className={cx("eyebrow")}>{eyebrow}</span>
        <h2 className={cx("title")}>{title}</h2>
      </div>
      <Link href="/themes" className={cx("moreLink")}>
        더보기
        <FiArrowRight aria-hidden />
      </Link>
    </div>
  );
}
