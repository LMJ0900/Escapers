import { THEME_GENRE } from "@escapers/shared";

import { formatPlayers } from "@/api/domain/theme/Theme.detail";
import type { getThemeDetailResponse } from "@/api/domain/theme/getThemeDetail/response/getThemeDetailRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThemeFacts.module.css";

const cx = bindClassNames(styles);

const MAX_DIFFICULTY = 5;

type ThemeFactsProps = {
  theme: getThemeDetailResponse;
};

/** 난이도 · 인원 · 플레이 시간 · 장르 정보 줄. 크롤링 소스에 없는 항목은 숨긴다. */
export default function ThemeFacts({ theme }: ThemeFactsProps) {
  const players = formatPlayers(theme.minPlayers, theme.maxPlayers);

  return (
    <dl className={cx("root")}>
      {theme.difficulty !== null && (
        <div className={cx("fact")}>
          <dt className={cx("label")}>난이도</dt>
          <dd
            className={cx("value", "difficulty")}
            aria-label={`난이도 ${theme.difficulty} / ${MAX_DIFFICULTY}`}
          >
            <span className={cx("difficultyOn")}>
              {"●".repeat(theme.difficulty)}
            </span>
            {"○".repeat(MAX_DIFFICULTY - theme.difficulty)}
          </dd>
        </div>
      )}
      {players && (
        <div className={cx("fact")}>
          <dt className={cx("label")}>인원</dt>
          <dd className={cx("value")}>{players}</dd>
        </div>
      )}
      {theme.playMinutes !== null && (
        <div className={cx("fact")}>
          <dt className={cx("label")}>플레이 시간</dt>
          <dd className={cx("value")}>{theme.playMinutes}분</dd>
        </div>
      )}
      <div className={cx("fact", "factGenre")}>
        <dt className={cx("label")}>장르</dt>
        <dd className={cx("value")}>{THEME_GENRE.label(theme.genre)}</dd>
      </div>
    </dl>
  );
}
