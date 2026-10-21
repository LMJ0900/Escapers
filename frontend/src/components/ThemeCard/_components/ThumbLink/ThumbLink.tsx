import { THEME_GENRE } from "@escapers/shared";
import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";

import type { ThemeListItem } from "@/api/domain/theme/Theme.type";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThumbLink.module.css";

const cx = bindClassNames(styles);

/**
 * 썸네일이 실제로 차지하는 너비. 홈 캐러셀은 5열(최대 1440px), "모든 테마"는 사이드바 옆 4열이고
 * 768px 이하에서는 둘 다 2열 안팎이라, 넉넉히 잡아 브라우저가 알맞은 srcset 을 고르게 한다.
 */
const THUMB_SIZES = "(max-width: 768px) 50vw, (max-width: 1440px) 25vw, 360px";

type ThumbLinkProps = {
  theme: ThemeListItem;
  rank?: number;
};

/** 썸네일 + 테마 이름. 둘 다 같은 링크 안에 있어서 어느 쪽에 올려도 hover 안내가 뜬다. */
export default function ThumbLink({ theme, rank }: ThumbLinkProps) {
  return (
    <Link href={`/themes/${theme.id}`} className={cx("thumbLink")}>
      <span className={cx("thumb")} aria-hidden>
        {/* 테마 이름이 같은 링크 안에 있어 포스터는 장식으로 두고 alt 를 비운다.
            원본이 깨져도 빈 alt 라 아이콘 없이 썸네일 배경만 보인다. */}
        {theme.imageUrl && (
          <Image
            src={theme.imageUrl}
            alt=""
            fill
            sizes={THUMB_SIZES}
            className={cx("poster")}
          />
        )}
        {rank !== undefined && (
          <>
            <span className={cx("thumbScrim")} />
            <span className={cx("rank")}>{String(rank).padStart(2, "0")}</span>
          </>
        )}
        <span className={cx("genreTag")}>{THEME_GENRE.label(theme.genre)}</span>
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
