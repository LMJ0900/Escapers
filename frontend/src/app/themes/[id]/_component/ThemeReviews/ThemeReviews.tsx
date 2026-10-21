"use client";

import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { FiCheck, FiChevronDown } from "react-icons/fi";
import { toast } from "react-toastify";

import { REVIEW_PAGE_SIZE } from "@/api/domain/theme/Theme.detail";
import type { PutReviewHelpfulErrorResponse } from "@/api/domain/theme/Theme.error";
import { REVIEW_SORT } from "@/api/domain/theme/Theme.label";
import { ThemeMutation } from "@/api/domain/theme/Theme.mutation";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { ThemeReviewSort } from "@/api/domain/theme/Theme.type";
import type { getThemeReviewsResponse } from "@/api/domain/theme/getThemeReviews/response/getThemeReviewsRes";
import type { PutReviewHelpfulRequest } from "@/api/domain/theme/putReviewHelpful/request/PutReviewHelpfulReq";
import type { PutReviewHelpfulResponse } from "@/api/domain/theme/putReviewHelpful/response/PutReviewHelpfulRes";
import { bindClassNames } from "@/util/BindClassName";

import ReviewItem from "./_component/ReviewItem/ReviewItem";
import ReviewSummary from "./_component/ReviewSummary/ReviewSummary";
import styles from "./ThemeReviews.module.css";

const cx = bindClassNames(styles);

const DEFAULT_SORT: ThemeReviewSort = "HELPFUL";

type ThemeReviewsProps = {
  themeId: string;
  /** 기본 정렬(도움순) 첫 페이지. 서버에서 미리 받아 첫 화면에 바로 그린다. */
  initialPage: getThemeReviewsResponse;
};

export default function ThemeReviews({
  themeId,
  initialPage,
}: ThemeReviewsProps) {
  const queryClient = useQueryClient();

  const [sort, setSort] = useState<ThemeReviewSort>(DEFAULT_SORT);
  const [photoOnly, setPhotoOnly] = useState(false);
  const isDefaultQuery = sort === DEFAULT_SORT && !photoOnly;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isFetching } =
    useInfiniteQuery({
      queryKey: ThemeQuery.getThemeReviewsQueryKey(themeId, {
        sort,
        photoOnly,
      }),
      queryFn: ({ pageParam }) =>
        ThemeQuery.getThemeReviews({
          themeId,
          sort,
          photoOnly,
          size: REVIEW_PAGE_SIZE,
          cursor: pageParam,
        }),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
      initialData: isDefaultQuery
        ? { pages: [initialPage], pageParams: [undefined] }
        : undefined,
      placeholderData: keepPreviousData,
    });

  const reviews =
    data?.pages.flatMap((page) => page.items) ?? initialPage.items;
  const summary = data?.pages[0]?.summary ?? initialPage.summary;
  const isRefiltering = isFetching && !isFetchingNextPage;

  // ================= 도움이 돼요 =================
  const [pendingReviewId, setPendingReviewId] = useState<string | null>(null);

  const { mutate: submitHelpful } = useMutation<
    PutReviewHelpfulResponse,
    PutReviewHelpfulErrorResponse,
    PutReviewHelpfulRequest
  >({
    mutationFn: ThemeMutation.putReviewHelpful,
    onSuccess: (result, variables) => {
      // 같은 후기가 정렬·필터별 캐시에 동시에 있을 수 있어 이 테마의 후기 캐시를 모두 갱신한다.
      queryClient.setQueriesData<InfiniteData<getThemeReviewsResponse>>(
        { queryKey: ThemeQuery.themeReviewsQueryKey(themeId) },
        (prev) =>
          prev && {
            ...prev,
            pages: prev.pages.map((page) => ({
              ...page,
              items: page.items.map((item) =>
                item.id === variables.reviewId
                  ? {
                      ...item,
                      helped: result.helped,
                      helpfulCount: result.helpfulCount,
                    }
                  : item
              ),
            })),
          }
      );
    },
    onError: (error) => {
      toast.error(
        error.code === "AUTH_TOKEN_MISSING"
          ? "도움이 돼요는 로그인 후 이용할 수 있어요."
          : "잠시 후 다시 시도해주세요."
      );
    },
    onSettled: () => setPendingReviewId(null),
  });

  const toggleHelpful = (reviewId: string, helped: boolean) => {
    setPendingReviewId(reviewId);
    submitHelpful({ themeId, reviewId, helped: !helped });
  };

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

  const currentSortLabel = REVIEW_SORT.label(sort);

  return (
    <section id="reviews" className={cx("root")}>
      <div className={cx("head")}>
        <h2 className={cx("title")}>
          후기 <span className={cx("titleCount")}>{summary.reviewCount}</span>
        </h2>
        <button
          type="button"
          className={cx("button")}
          // TODO: 후기 작성 화면/API 가 생기면 연결
          onClick={() => toast.info("후기 작성은 곧 만나볼 수 있어요.")}
        >
          후기 작성
        </button>
      </div>

      <ReviewSummary summary={summary} />

      <div className={cx("controls")}>
        <label className={cx("photoOnly")}>
          <input
            type="checkbox"
            className={cx("checkbox")}
            checked={photoOnly}
            onChange={(event) => setPhotoOnly(event.target.checked)}
          />
          사진 후기만 보기
        </label>

        <div className={cx("sortWrap")} ref={sortWrapRef}>
          <button
            type="button"
            className={cx("button")}
            aria-expanded={isSortOpen}
            aria-haspopup="listbox"
            onClick={() => setIsSortOpen((prev) => !prev)}
          >
            {currentSortLabel}
            <FiChevronDown aria-hidden />
          </button>
          {isSortOpen && (
            <div className={cx("sortMenu")} role="listbox">
              {REVIEW_SORT.values.map((value) => (
                <button
                  key={value}
                  type="button"
                  role="option"
                  aria-selected={value === sort}
                  className={cx("sortOption", {
                    sortOptionOn: value === sort,
                  })}
                  onClick={() => {
                    setSort(value);
                    setIsSortOpen(false);
                  }}
                >
                  {REVIEW_SORT.label(value)}
                  {value === sort && <FiCheck aria-hidden />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className={cx("empty")}>
          {photoOnly
            ? "사진이 있는 후기가 없어요."
            : "아직 등록된 후기가 없어요."}
        </p>
      ) : (
        <div className={cx("list", { listLoading: isRefiltering })}>
          {reviews.map((review) => (
            <ReviewItem
              key={review.id}
              review={review}
              pending={pendingReviewId === review.id}
              onToggleHelpful={() => toggleHelpful(review.id, review.helped)}
            />
          ))}
        </div>
      )}

      {hasNextPage && (
        <button
          type="button"
          className={cx("button", "moreButton")}
          disabled={isFetchingNextPage}
          onClick={() => fetchNextPage()}
        >
          {isFetchingNextPage ? "불러오는 중…" : "후기 더 보기"}
        </button>
      )}
    </section>
  );
}
