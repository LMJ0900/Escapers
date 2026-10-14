import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import { GENRE_LABEL } from "@/api/domain/theme/Theme.filter";
import type { ThemeListItem } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThumbLink.module.css";

const cx = bindClassNames(styles);

type ThumbLinkProps = {
  theme: ThemeListItem;
  rank?: number;
};

/** 썸네일 + 테마 이름. 둘 다 같은 링크 안에 있어서 어느 쪽에 올려도 hover 안내가 뜬다. */
export default function ThumbLink({ theme, rank }: ThumbLinkProps) {
  return (
    // TODO: 테마 상세 페이지가 구현되면 실제 라우트로 연결
    <Link href={`/themes/${theme.id}`} className={cx("thumbLink")}>
      <span className={cx("thumb")} aria-hidden>
        {rank !== undefined && (
          <>
            <span className={cx("thumbScrim")} />
            <span className={cx("rank")}>{String(rank).padStart(2, "0")}</span>
          </>
        )}
        <span className={cx("genreTag")}>{GENRE_LABEL[theme.genre]}</span>
        <span className={cx("hoverHint")}>
          <span className={cx("hoverHintLabel")}>
            해당 테마로 이동
            <FiArrowRight aria-hidden />
          </span>
        </span>
      </span>
      <span className={cx("themeName")}>{theme.name}</span>
    </Link>
  );
}
