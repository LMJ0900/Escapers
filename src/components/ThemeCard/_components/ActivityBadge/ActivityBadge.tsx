import { ACTIVITY_LABEL } from "@/api/domain/theme/Theme.filter";
import type { ThemeActivityLevel } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ActivityBadge.module.css";

const cx = bindClassNames(styles);

type ActivityBadgeProps = {
  activityLevel: ThemeActivityLevel;
};

export default function ActivityBadge({ activityLevel }: ActivityBadgeProps) {
  return (
    <span
      className={cx("activity", {
        activityHigh: activityLevel === "HIGH",
        activityMedium: activityLevel === "MEDIUM",
        activityLow: activityLevel === "LOW",
      })}
    >
      <span className={cx("activityDot")} />
      {ACTIVITY_LABEL[activityLevel]}
    </span>
  );
}
