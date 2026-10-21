import { ACTIVITY_NOTICE } from "@/api/domain/theme/Theme.label";
import type { ThemeActivityLevel } from "@/api/domain/theme/Theme.type";
import ActivityLevel from "@/components/ActivityLevel";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ActivityNotice.module.css";

const cx = bindClassNames(styles);

type ActivityNoticeProps = {
  activityLevel: ThemeActivityLevel;
};

/** 활동성(몸을 쓰는 정도) 단계와 그에 맞는 복장 안내. */
export default function ActivityNotice({ activityLevel }: ActivityNoticeProps) {
  return (
    <div className={cx("root")}>
      <div className={cx("head")}>
        <span className={cx("label")}>활동성</span>
        <ActivityLevel level={activityLevel} variant="plain" />
      </div>
      <p className={cx("message")}>{ACTIVITY_NOTICE[activityLevel]}</p>
    </div>
  );
}
