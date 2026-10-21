import { THEME_GENRE } from "@escapers/shared";
import { FaStar } from "react-icons/fa";

import type { getThemeDetailResponse } from "@/api/domain/theme/getThemeDetail/response/getThemeDetailRes";
import { bindClassNames } from "@/util/BindClassName";

import ThemeActions from "./_component/ThemeActions/ThemeActions";
import styles from "./ThemeTitleBlock.module.css";

const cx = bindClassNames(styles);

type ThemeTitleBlockProps = {
  theme: getThemeDetailResponse;
};

/** 장르 태그 · 테마 이름 · 지점/평점 + 좋아요/공유 버튼. */
export default function ThemeTitleBlock({ theme }: ThemeTitleBlockProps) {
  return (
    <div className={cx("root")}>
      <div className={cx("info")}>
        <span className={cx("genreTag")}>{THEME_GENRE.label(theme.genre)}</span>
        <h1 className={cx("title")}>{theme.name}</h1>
        <div className={cx("meta")}>
          <span>
            {theme.brandName} · {theme.branchName}
          </span>
          {theme.ratingAvg !== null && (
            <>
              <span className={cx("divider")} aria-hidden />
              <a href="#reviews" className={cx("rating")}>
                <FaStar className={cx("ratingStar")} aria-hidden />
                {theme.ratingAvg.toFixed(1)}
                <span className={cx("ratingCount")}>
                  (후기 {theme.reviewCount})
                </span>
              </a>
            </>
          )}
        </div>
      </div>

      <ThemeActions initialTheme={theme} />
    </div>
  );
}
