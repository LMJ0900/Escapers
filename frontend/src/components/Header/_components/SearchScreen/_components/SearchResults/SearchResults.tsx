"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import ThemeCardSkeleton from "@/components/ThemeCardSkeleton";
import { useThemeLike } from "@/hooks/useThemeLike";
import { bindClassNames } from "@/util/BindClassName";

import { useSearch } from "../../../SearchProvider/SearchProvider";
import SearchNoResults from "../SearchNoResults/SearchNoResults";
import SearchResultCard from "../SearchResultCard/SearchResultCard";
import styles from "./SearchResults.module.css";

const cx = bindClassNames(styles);

const SKELETON_COUNT = 10;

type SearchResultsProps = {
  /** 디바운스가 끝나 실제로 검색하는 검색어. 입력창의 값보다 조금 늦게 따라온다. */
  keyword: string;
  /** 입력창의 값이 아직 `keyword`에 반영되지 않은 상태 */
  isTyping: boolean;
};

export default function SearchResults({
  keyword,
  isTyping,
}: SearchResultsProps) {
  const { setQuery } = useSearch();
  const { pendingLikeId, toggleLike } = useThemeLike();

  const { data, isError, isFetching } = useQuery({
    queryKey: ThemeQuery.searchThemesQueryKey(keyword),
    queryFn: () => ThemeQuery.searchThemes({ keyword }),
    enabled: keyword !== "",
    // 새 검색어의 결과가 오기 전까지 이전 결과를 흐리게 보여줘서 화면이 깜박이지 않게 한다.
    placeholderData: keepPreviousData,
  });

  const isRefreshing = isTyping || isFetching;
  const terms = keyword.split(" ").filter(Boolean);

  if (!data) {
    if (isError) {
      return (
        <section className={cx("root")}>
          <p className={cx("message")}>
            검색 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.
          </p>
        </section>
      );
    }

    return (
      <section className={cx("root")} aria-busy>
        <div className={cx("grid")}>
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <ThemeCardSkeleton key={index} />
          ))}
        </div>
      </section>
    );
  }

  if (data.totalCount === 0) {
    return (
      <div className={cx({ refreshing: isRefreshing })}>
        <SearchNoResults query={keyword} />
      </div>
    );
  }

  return (
    <section
      className={cx("root", { refreshing: isRefreshing })}
      aria-label="검색 결과"
      aria-busy={isRefreshing}
    >
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>Search</span>
        <h1 className={cx("title")}>
          ‘{keyword}’ 검색 결과{" "}
          <span className={cx("count")}>테마 {data.totalCount}개</span>
        </h1>
      </div>

      {data.relatedKeywords.length > 0 && (
        <div className={cx("related")}>
          <span className={cx("relatedLabel")}>관련 검색</span>
          <div className={cx("chips")}>
            {data.relatedKeywords.map((related) => (
              <button
                key={related}
                type="button"
                className={cx("chip")}
                onClick={() => setQuery(related)}
              >
                {related}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className={cx("grid")}>
        {data.items.map((theme) => (
          <SearchResultCard
            key={theme.id}
            theme={theme}
            terms={terms}
            pending={pendingLikeId === theme.id}
            onToggleLike={() => toggleLike(theme.id, theme.liked)}
          />
        ))}
      </div>
    </section>
  );
}
