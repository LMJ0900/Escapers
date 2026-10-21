import { THEME_GENRE } from "@escapers/shared";
import Image from "next/image";
import Link from "next/link";

import type { ThemeListItem } from "@/api/domain/theme/Theme.type";
import LikeButton from "@/components/ThemeCard/_components/LikeButton/LikeButton";
import { bindClassNames } from "@/util/BindClassName";

import HighlightText from "../HighlightText/HighlightText";
import styles from "./SearchResultCard.module.css";

const cx = bindClassNames(styles);

const THUMB_SIZES = "(max-width: 768px) 50vw, (max-width: 1100px) 33vw, 20vw";

type SearchResultCardProps = {
  theme: ThemeListItem;
  /** 일치한 글자를 강조할 검색어 단어들 */
  terms: string[];
  pending: boolean;
  onToggleLike: () => void;
};

/** 검색 결과 카드. 장르 태그·테마명·지점에서 검색어와 일치한 글자를 강조한다. */
export default function SearchResultCard({
  theme,
  terms,
  pending,
  onToggleLike,
}: SearchResultCardProps) {
  return (
    <div className={cx("card")}>
      <div className={cx("thumb")}>
        {/* 카드 전체가 링크라 포스터는 장식으로 두고 alt 를 비운다. */}
        <Link
          href={`/themes/${theme.id}`}
          className={cx("posterLink")}
          tabIndex={-1}
          aria-hidden
        >
          {theme.imageUrl && (
            <Image
              src={theme.imageUrl}
              alt=""
              fill
              sizes={THUMB_SIZES}
              className={cx("poster")}
            />
          )}
        </Link>
        <span className={cx("genreTag")}>
          <HighlightText text={THEME_GENRE.label(theme.genre)} terms={terms} />
        </span>
        <div className={cx("heart")}>
          <LikeButton
            liked={theme.liked}
            themeName={theme.name}
            pending={pending}
            onToggle={onToggleLike}
          />
        </div>
      </div>

      <Link href={`/themes/${theme.id}`} className={cx("info")}>
        <span className={cx("name")}>
          <HighlightText text={theme.name} terms={terms} />
        </span>
        <span className={cx("meta")}>
          <span className={cx("branch")}>
            <HighlightText
              text={`${theme.brandName} · ${theme.branchName}`}
              terms={terms}
            />
          </span>
          <span
            className={cx("price", { priceUnknown: theme.priceFrom === null })}
          >
            {theme.priceFrom === null
              ? "가격 문의"
              : `${theme.priceFrom.toLocaleString("ko-KR")}원~`}
          </span>
        </span>
      </Link>
    </div>
  );
}
