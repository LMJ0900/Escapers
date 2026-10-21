import Image from "next/image";
import { FiThumbsUp } from "react-icons/fi";

import {
  formatRemainingTime,
  formatReviewDate,
} from "@/api/domain/theme/Theme.detail";
import type { ThemeReview } from "@/api/domain/theme/Theme.type";
import StarRating from "@/components/StarRating";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ReviewItem.module.css";

const cx = bindClassNames(styles);

type ReviewItemProps = {
  review: ThemeReview;
  pending: boolean;
  onToggleHelpful: () => void;
};

/** 후기 한 건: 작성자 · 플레이 기록(탈출 성공/실패) · 본문 · 사진 · 도움이 돼요. */
export default function ReviewItem({
  review,
  pending,
  onToggleHelpful,
}: ReviewItemProps) {
  return (
    <article className={cx("root")}>
      <header className={cx("author")}>
        <span className={cx("avatar")} aria-hidden>
          {review.nickname.charAt(0)}
        </span>
        <div className={cx("authorInfo")}>
          <span className={cx("nickname")}>{review.nickname}</span>
          <span className={cx("authorMeta")}>
            <StarRating rating={review.rating} />
            <time dateTime={review.writtenAt}>
              {formatReviewDate(review.writtenAt)}
            </time>
          </span>
        </div>
      </header>

      <div className={cx("play")}>
        {review.playerCount !== null && (
          <span>{review.playerCount}인 플레이</span>
        )}
        <span className={cx("result", review.cleared ? "win" : "lose")}>
          {review.cleared ? "탈출 성공" : "탈출 실패"}
        </span>
        {review.cleared && review.remainingSeconds !== null && (
          <span>남은 시간 {formatRemainingTime(review.remainingSeconds)}</span>
        )}
        {!review.cleared && review.hintCount !== null && (
          <span>힌트 {review.hintCount}회 사용</span>
        )}
      </div>

      <p className={cx("content")}>{review.content}</p>

      {review.photoUrls.length > 0 && (
        <ul className={cx("photos")}>
          {review.photoUrls.map((url, index) => (
            <li key={`${url}-${index}`} className={cx("photo")}>
              <Image
                src={url}
                alt={`${review.nickname}님의 후기 사진 ${index + 1}`}
                fill
                sizes="88px"
                className={cx("photoImage")}
              />
            </li>
          ))}
        </ul>
      )}

      <div>
        <button
          type="button"
          className={cx("helpful", { helpfulOn: review.helped })}
          aria-pressed={review.helped}
          disabled={pending}
          onClick={onToggleHelpful}
        >
          <FiThumbsUp aria-hidden />
          도움이 돼요 {review.helpfulCount}
        </button>
      </div>
    </article>
  );
}
