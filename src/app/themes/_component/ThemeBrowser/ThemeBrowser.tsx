"use client";

import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { FiCheck, FiChevronDown, FiLoader, FiX } from "react-icons/fi";

import {
  isThemeFilterEmpty,
  parseThemeSearchParams,
  themeFilterStateToSearchParams,
  THEME_SORT_OPTIONS,
  type ThemeFilterState,
} from "@/api/domain/theme/Theme.filter";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { ThemeSortOption } from "@/api/domain/theme/Theme.type";
import type { getThemesResponse } from "@/api/domain/theme/getThemes/response/getThemesRes";
import ThemeCard from "@/components/ThemeCard";
import { useThemeLike } from "@/hooks/useThemeLike";
import { bindClassNames } from "@/util/BindClassName";

import FilterPanel from "../FilterPanel/FilterPanel";
import styles from "./ThemeBrowser.module.css";

const cx = bindClassNames(styles);

type FilterGroup = "brands" | "regions" | "genres" | "activityLevels";

type ThemeBrowserProps = {
  initialFilters: ThemeFilterState;
  initialPage: getThemesResponse;
  pageSize: number;
};

export default function ThemeBrowser({
  initialFilters,
  initialPage,
  pageSize,
}: ThemeBrowserProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = useMemo(
    () => parseThemeSearchParams(Object.fromEntries(searchParams.entries())),
    [searchParams]
  );

  const isInitialFilters =
    themeFilterStateToSearchParams(filters).toString() ===
    themeFilterStateToSearchParams(initialFilters).toString();

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ThemeQuery.getThemesQueryKey(filters),
      queryFn: ({ pageParam }) =>
        ThemeQuery.getThemes({ ...filters, size: pageSize, cursor: pageParam }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: isInitialFilters
        ? { pages: [initialPage], pageParams: [undefined] }
        : undefined,
      placeholderData: keepPreviousData,
    });

  const items = data?.pages.flatMap((page) => page.items) ?? initialPage.items;
  const facets = data?.pages[0]?.facets ?? initialPage.facets;
  const totalCount = data?.pages[0]?.totalCount ?? initialPage.totalCount;
  const isRefiltering = isFetching && !isFetchingNextPage;

  // ================= 필터 / 정렬 → URL =================
  const updateFilters = (next: ThemeFilterState) => {
    const query = themeFilterStateToSearchParams(next).toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  };

  const handleToggleFilter = (group: FilterGroup, value: string) => {
    const current = filters[group];
    const nextValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilters({ ...filters, [group]: nextValues });
  };

  const handleReset = () =>
    updateFilters({
      brands: [],
      regions: [],
      genres: [],
      activityLevels: [],
      sort: filters.sort,
    });

  const handleSortChange = (sort: ThemeSortOption) => {
    updateFilters({ ...filters, sort });
    setIsSortOpen(false);
  };

  const activeChips = (
    ["brands", "regions", "genres", "activityLevels"] as const
  ).flatMap((group) =>
    filters[group].map((value) => ({
      group,
      value,
      label:
        facets[group].find((option) => option.value === value)?.label ?? value,
    }))
  );

  // ================= 정렬 드롭다운 =================
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSortOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        sortWrapRef.current &&
        !sortWrapRef.current.contains(event.target as Node)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isSortOpen]);

  const currentSortLabel =
    THEME_SORT_OPTIONS.find((option) => option.value === filters.sort)?.label ??
    "인기순";

  // ================= 모바일 필터 바텀시트 =================
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // ================= 무한 스크롤 =================
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ================= 좋아요 =================
  const { pendingLikeId, toggleLike } = useThemeLike();

  const sortControl = (
    <div className={cx("sortWrap")} ref={sortWrapRef}>
      <button
        type="button"
        className={cx("pillBtn")}
        aria-expanded={isSortOpen}
        onClick={() => setIsSortOpen((prev) => !prev)}
      >
        {currentSortLabel}
        <FiChevronDown aria-hidden />
      </button>
      {isSortOpen && (
        <div className={cx("sortMenu")} role="listbox">
          {THEME_SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === filters.sort}
              className={cx("sortOption", {
                sortOptionOn: option.value === filters.sort,
              })}
              onClick={() => handleSortChange(option.value)}
            >
              {option.label}
              {option.value === filters.sort && <FiCheck aria-hidden />}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className={cx("layout")}>
      <aside className={cx("sidebar")}>
        <FilterPanel
          facets={facets}
          filters={filters}
          onToggle={handleToggleFilter}
          onReset={handleReset}
        />
      </aside>

      <section className={cx("content")}>
        <div className={cx("mobileFilterBar")}>
          <button
            type="button"
            className={cx("pillBtn")}
            onClick={() => setIsMobileFilterOpen(true)}
          >
            필터{!isThemeFilterEmpty(filters) && ` ${activeChips.length}`}
            <FiChevronDown aria-hidden />
          </button>
        </div>

        <div className={cx("toolbar")}>
          <div className={cx("chips")}>
            {activeChips.map((chip) => (
              <button
                key={`${chip.group}-${chip.value}`}
                type="button"
                className={cx("chip")}
                onClick={() => handleToggleFilter(chip.group, chip.value)}
              >
                {chip.label}
                <FiX aria-hidden />
              </button>
            ))}
          </div>
          {sortControl}
        </div>

        {items.length === 0 ? (
          <p className={cx("emptyState")}>조건에 맞는 테마가 없어요.</p>
        ) : (
          <div className={cx("grid", { gridLoading: isRefiltering })}>
            {items.map((item) => (
              <ThemeCard
                key={item.id}
                theme={item}
                pending={pendingLikeId === item.id}
                onToggleLike={() => toggleLike(item.id, item.liked)}
              />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className={cx("sentinel")}>
          {isFetchingNextPage && (
            <>
              <div className={cx("skeletonRow")}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}>
                    <div className={cx("skeletonThumb")} />
                    <div
                      className={cx("skeletonLine")}
                      style={{ width: "70%" }}
                    />
                    <div
                      className={cx("skeletonLine")}
                      style={{ width: "45%" }}
                    />
                  </div>
                ))}
              </div>
              <span className={cx("loadingLabel")}>
                <FiLoader className={cx("loadingSpinner")} aria-hidden />
                다음 테마를 불러오는 중
              </span>
            </>
          )}
          {!hasNextPage && items.length > 0 && !isFetchingNextPage && (
            <p className={cx("endMessage")}>마지막 테마까지 모두 확인했어요</p>
          )}
        </div>
      </section>

      {isMobileFilterOpen && (
        <div
          className={cx("sheetOverlay")}
          onClick={() => setIsMobileFilterOpen(false)}
        >
          <div
            className={cx("sheet")}
            role="dialog"
            aria-label="필터"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={cx("sheetHeader")}>
              필터
              <button
                type="button"
                className={cx("sheetCloseBtn")}
                aria-label="닫기"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                <FiX aria-hidden />
              </button>
            </div>
            <div className={cx("sheetBody")}>
              <FilterPanel
                facets={facets}
                filters={filters}
                onToggle={handleToggleFilter}
                onReset={handleReset}
              />
            </div>
            <div className={cx("sheetFooter")}>
              <button
                type="button"
                className={cx("sheetApplyBtn")}
                onClick={() => setIsMobileFilterOpen(false)}
              >
                {totalCount}개 테마 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
