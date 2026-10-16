import type { ThemeFilterState } from "@/api/domain/theme/Theme.filter";
import type { ThemeFacets } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./FilterPanel.module.css";

const cx = bindClassNames(styles);

type FilterGroup = "brands" | "regions" | "genres" | "activityLevels";

const GROUPS: { key: FilterGroup; label: string }[] = [
  { key: "brands", label: "지점" },
  { key: "regions", label: "지역" },
  { key: "genres", label: "장르" },
  { key: "activityLevels", label: "활동성" },
];

type FilterPanelProps = {
  facets: ThemeFacets;
  filters: ThemeFilterState;
  onToggle: (group: FilterGroup, value: string) => void;
  onReset: () => void;
};

/** 지점/지역/장르/활동성 체크박스 그룹. 데스크톱 사이드바와 모바일 바텀시트가 함께 쓴다. */
export default function FilterPanel({
  facets,
  filters,
  onToggle,
  onReset,
}: FilterPanelProps) {
  return (
    <div className={cx("root")}>
      <button type="button" className={cx("resetBtn")} onClick={onReset}>
        필터 초기화
      </button>
      <div className={cx("hr")} />

      {GROUPS.map((group, index) => (
        <div key={group.key}>
          {index > 0 && <div className={cx("hr")} />}
          <p className={cx("groupLabel")}>{group.label}</p>
          <div className={cx("options")}>
            {facets[group.key].map((option) => {
              const checked = filters[group.key].includes(option.value);
              return (
                <label key={option.value} className={cx("row")}>
                  <input
                    type="checkbox"
                    className={cx("checkbox")}
                    checked={checked}
                    onChange={() => onToggle(group.key, option.value)}
                  />
                  <span className={cx("optionLabel")}>{option.label}</span>
                  <span className={cx("count")}>({option.count})</span>
                </label>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
