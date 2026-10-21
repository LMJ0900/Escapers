import { FaStar } from "react-icons/fa";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./StarRating.module.css";

const cx = bindClassNames(styles);

const MAX_RATING = 5;

type StarRatingProps = {
  /** 0~5. 소수는 가장 가까운 정수만큼 별을 채운다. */
  rating: number;
  size?: number;
};

export default function StarRating({ rating, size = 12 }: StarRatingProps) {
  const filled = Math.round(rating);

  return (
    <span
      className={cx("root")}
      role="img"
      aria-label={`별점 ${MAX_RATING}점 만점에 ${rating}점`}
    >
      {Array.from({ length: MAX_RATING }, (_, index) => (
        <FaStar
          key={index}
          size={size}
          aria-hidden
          className={cx("star", { starOn: index < filled })}
        />
      ))}
    </span>
  );
}
