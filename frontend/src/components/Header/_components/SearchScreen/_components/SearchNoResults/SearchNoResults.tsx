import { THEME_GENRE } from "@escapers/shared";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./SearchNoResults.module.css";

const cx = bindClassNames(styles);

const SUGGESTIONS = [
  "철자가 맞는지 확인해 보세요",
  "더 짧거나 다른 키워드로 검색해 보세요",
  "테마명, 장르, 지점 중 하나로 검색할 수 있어요",
];

/** 대표 장르만 보여준다. 눌렀을 때의 테마 목록은 `/themes?genres=` 필터를 쓴다. */
const GENRE_SHORTCUTS = [
  "HORROR",
  "IMMERSIVE",
  "MYSTERY",
  "SF",
  "COMEDY",
] as const;

type SearchNoResultsProps = {
  query: string;
};

export default function SearchNoResults({ query }: SearchNoResultsProps) {
  return (
    <section className={cx("root")} aria-label="검색 결과 없음">
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>Search</span>
        <h1 className={cx("title")}>‘{query}’에 맞는 테마가 없어요</h1>
        <p className={cx("lead")}>검색어를 바꿔서 다시 찾아보세요.</p>
      </div>

      <ul className={cx("tips")}>
        {SUGGESTIONS.map((tip) => (
          <li key={tip} className={cx("tip")}>
            {tip}
          </li>
        ))}
      </ul>

      <div className={cx("genres")}>
        <span className={cx("genresLabel")}>장르로 찾아보기</span>
        <div className={cx("chips")}>
          {GENRE_SHORTCUTS.map((genre) => (
            <Link
              key={genre}
              href={`/themes?genres=${genre}`}
              className={cx("chip")}
            >
              {THEME_GENRE.label(genre)}
            </Link>
          ))}
        </div>
      </div>

      <Link href="/themes" className={cx("allLink")}>
        모든 테마 보기
        <FiArrowRight aria-hidden />
      </Link>
    </section>
  );
}
