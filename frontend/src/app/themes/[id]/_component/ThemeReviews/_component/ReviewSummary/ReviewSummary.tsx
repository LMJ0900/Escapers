import type { ThemeReviewSummary } from "@/api/domain/theme/Theme.type";
import StarRating from "@/components/StarRating";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ReviewSummary.module.css";

const cx = bindClassNames(styles);

type ReviewSummaryProps = {
  summary: ThemeReviewSummary;
};

/** 평균 평점 + 별점 분포. */
export default function ReviewSummary({ summary }: ReviewSummaryProps) {
  if (summary.ratingAvg === null || summary.reviewCount === 0) {
    return <p className={cx("empty")}>아직 등록된 후기가 없어요.</p>;
  }

  return (
    <div className={cx("root")}>
      <div className={cx("score")}>
        <span className={cx("scoreValue")}>{summary.ratingAvg.toFixed(1)}</span>
        <StarRating rating={summary.ratingAvg} size={16} />
        <span className={cx("scoreCount")}>후기 {summary.reviewCount}개</span>
      </div>

      <ul className={cx("bars")}>
        {summary.distribution.map(({ rating, count }) => (
          <li key={rating} className={cx("bar")}>
            <span className={cx("barLabel")}>{rating}점</span>
            <span className={cx("barTrack")} aria-hidden>
              <span
                className={cx("barFill")}
                style={{ width: `${(count / summary.reviewCount) * 100}%` }}
              />
            </span>
            <span className={cx("barCount")}>{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
