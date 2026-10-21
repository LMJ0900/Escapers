import { THEME_ACTIVITY, formatActivityLabel } from "@escapers/shared";

import type { ThemeActivityLevel } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ActivityLevel.module.css";

const cx = bindClassNames(styles);

type ActivityLevelProps = {
  level: ThemeActivityLevel;
  /**
   * - `badge`: 테마 카드처럼 단독으로 보일 때. "활동 높음" 형태, 작은 글씨, 단계가 낮을수록 흐리게.
   * - `plain`: 상세처럼 "활동성" 항목명 옆에 붙을 때. "높음" 형태, 기본 글씨색.
   */
  variant?: "badge" | "plain";
};

/** 활동성 단계를 점(dot) + 라벨로 표시한다. */
export default function ActivityLevel({
  level,
  variant = "badge",
}: ActivityLevelProps) {
  return (
    <span className={cx("root", variant, level.toLowerCase())}>
      <span className={cx("dot")} aria-hidden />
      {variant === "badge"
        ? formatActivityLabel(level)
        : THEME_ACTIVITY.label(level)}
    </span>
  );
}
