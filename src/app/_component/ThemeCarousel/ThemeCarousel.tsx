"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type {
  ThemeCollectionType,
  ThemeListItem,
} from "@/api/domain/theme/Theme.type";
import ThemeCard from "@/components/ThemeCard";
import { useThemeLike } from "@/hooks/useThemeLike";
import { bindClassNames } from "@/util/BindClassName";

import CarouselDots from "./_component/CarouselDots/CarouselDots";
import CarouselHeader from "./_component/CarouselHeader/CarouselHeader";
import styles from "./ThemeCarousel.module.css";

const cx = bindClassNames(styles);

const PAGE_SIZE = 5;

type ThemeCarouselProps = {
  /** 제목 위에 작게 표시되는 영문 문구 */
  eyebrow: string;
  title: string;
  collectionType: ThemeCollectionType;
  initialThemes: ThemeListItem[];
};

export default function ThemeCarousel({
  eyebrow,
  title,
  collectionType,
  initialThemes,
}: ThemeCarouselProps) {
  const [page, setPage] = useState(0);

  const { data: themes } = useQuery({
    queryKey: ThemeQuery.getThemeCollectionQueryKey(collectionType),
    queryFn: () => ThemeQuery.getThemeCollection(collectionType),
    initialData: initialThemes,
  });

  const pageCount = Math.max(1, Math.ceil(themes.length / PAGE_SIZE));

  const goPrev = () => setPage((p) => (p - 1 + pageCount) % pageCount);
  const goNext = () => setPage((p) => (p + 1) % pageCount);

  const { pendingLikeId, toggleLike } = useThemeLike();

  return (
    <section className={cx("section")}>
      <CarouselHeader eyebrow={eyebrow} title={title} />

      <div className={cx("carousel")}>
        {pageCount > 1 && (
          <div className={cx("edgeZone", "edgeLeft")}>
            <button
              type="button"
              className={cx("arrowBtn")}
              aria-label={`이전 ${PAGE_SIZE}개 테마 보기`}
              onClick={goPrev}
            >
              <FiChevronLeft aria-hidden />
            </button>
          </div>
        )}

        <div className={cx("row")}>
          {/*
           * 데스크톱은 화살표로 5개씩 페이지를 넘기고, 모바일은 화살표 없이 전체를
           * 가로 스크롤한다. 그래서 항상 10개 전부를 렌더링해두고, 현재 페이지가
           * 아닌 카드는 데스크톱 CSS에서만 숨긴다(모바일에서는 다시 보이게 됨) —
           * 5개만 렌더링하면 모바일에서 6~10번으로 스크롤할 카드 자체가 없다.
           */}
          {themes.map((theme, index) => {
            const isOffPage =
              index < page * PAGE_SIZE || index >= page * PAGE_SIZE + PAGE_SIZE;
            return (
              <div
                key={theme.id}
                className={cx("cardSlot", { cardSlotOffPage: isOffPage })}
              >
                <ThemeCard
                  theme={theme}
                  rank={theme.rank}
                  pending={pendingLikeId === theme.id}
                  onToggleLike={() => toggleLike(theme.id, theme.liked)}
                />
              </div>
            );
          })}
        </div>

        {pageCount > 1 && (
          <div className={cx("edgeZone", "edgeRight")}>
            <button
              type="button"
              className={cx("arrowBtn")}
              aria-label={`다음 ${PAGE_SIZE}개 테마 보기`}
              onClick={goNext}
            >
              <FiChevronRight aria-hidden />
            </button>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <CarouselDots
          pageCount={pageCount}
          page={page}
          onSelect={setPage}
          getLabel={(i) =>
            `${i * PAGE_SIZE + 1}~${Math.min((i + 1) * PAGE_SIZE, themes.length)}위 테마 보기`
          }
        />
      )}
    </section>
  );
}
