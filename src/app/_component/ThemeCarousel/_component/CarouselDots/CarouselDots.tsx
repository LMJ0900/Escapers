import { bindClassNames } from "@/util/BindClassName";

import styles from "./CarouselDots.module.css";

const cx = bindClassNames(styles);

type CarouselDotsProps = {
  pageCount: number;
  page: number;
  onSelect: (page: number) => void;
  /** 각 점의 aria-label */
  getLabel: (page: number) => string;
};

export default function CarouselDots({
  pageCount,
  page,
  onSelect,
  getLabel,
}: CarouselDotsProps) {
  return (
    <div className={cx("dots")}>
      {Array.from({ length: pageCount }).map((_, i) => (
        <button
          key={i}
          type="button"
          className={cx("dot", { dotOn: i === page })}
          aria-label={getLabel(i)}
          aria-current={i === page ? "true" : undefined}
          onClick={() => onSelect(i)}
        />
      ))}
    </div>
  );
}
