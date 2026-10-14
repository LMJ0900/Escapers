import type { ThemeListItem } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import ActivityBadge from "./_components/ActivityBadge/ActivityBadge";
import DifficultyMeter from "./_components/DifficultyMeter/DifficultyMeter";
import LikeButton from "./_components/LikeButton/LikeButton";
import ThumbLink from "./_components/ThumbLink/ThumbLink";
import styles from "./ThemeCard.module.css";

const cx = bindClassNames(styles);

type ThemeCardProps = {
  theme: ThemeListItem;
  /** 홈 화면 캐러셀처럼 순위를 보여줘야 할 때만 넘긴다. "모든 테마"에서는 생략한다. */
  rank?: number;
  pending: boolean;
  onToggleLike: () => void;
};

/** 테마 카드 한 장. 홈 화면 캐러셀과 "모든 테마" 목록이 함께 쓴다. */
export default function ThemeCard({
  theme,
  rank,
  pending,
  onToggleLike,
}: ThemeCardProps) {
  return (
    <div className={cx("card")}>
      <ThumbLink theme={theme} rank={rank} />

      <div className={cx("metaRow")}>
        <span className={cx("branch")}>
          {theme.brandName} · {theme.branchName}
        </span>
        <div className={cx("priceGroup")}>
          <span className={cx("price")}>
            {theme.priceFrom.toLocaleString("ko-KR")}원~
          </span>
          <LikeButton
            liked={theme.liked}
            themeName={theme.name}
            pending={pending}
            onToggle={onToggleLike}
          />
        </div>
      </div>

      <div className={cx("metaRow")}>
        <DifficultyMeter difficulty={theme.difficulty} />
        <ActivityBadge activityLevel={theme.activityLevel} />
      </div>
    </div>
  );
}
