"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";
import { FaHeart } from "react-icons/fa";
import {
  FiArrowRight,
  FiChevronLeft,
  FiChevronRight,
  FiHeart,
} from "react-icons/fi";

import { ThemeMutation } from "@/api/domain/theme/Theme.mutation";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { getHotThemesResponse } from "@/api/domain/theme/getHotThemes/response/getHotThemesRes";
import type { PutThemeLikeErrorResponse } from "@/api/domain/theme/Theme.error";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./HotThemes.module.css";

const cx = bindClassNames(styles);

const PAGE_SIZE = 5;

type HotThemesProps = {
  initialHotThemes: getHotThemesResponse;
};

export default function HotThemes({ initialHotThemes }: HotThemesProps) {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);

  const { data: themes } = useQuery({
    queryKey: ThemeQuery.getHotThemesQueryKey,
    queryFn: () => ThemeQuery.getHotThemes(),
    initialData: initialHotThemes,
  });

  const pageCount = Math.max(1, Math.ceil(themes.length / PAGE_SIZE));

  const goPrev = () => setPage((p) => (p - 1 + pageCount) % pageCount);
  const goNext = () => setPage((p) => (p + 1) % pageCount);

  const { mutate: toggleLike } = useMutation<
    PutThemeLikeResponse,
    PutThemeLikeErrorResponse,
    { themeId: string; liked: boolean }
  >({
    mutationFn: ThemeMutation.putLike,
    onSuccess: (_, variables) => {
      queryClient.setQueryData<getHotThemesResponse>(
        ThemeQuery.getHotThemesQueryKey,
        (prev) =>
          prev?.map((theme) =>
            theme.id === variables.themeId
              ? { ...theme, liked: variables.liked }
              : theme
          )
      );
    },
    onError: (error) => {
      toast.error(
        error.code === "AUTH_TOKEN_MISSING"
          ? "좋아요 기능은 로그인 후 이용할 수 있어요."
          : "잠시 후 다시 시도해주세요."
      );
    },
    onSettled: () => setPendingLikeId(null),
  });

  const handleToggleLike = (theme: getHotThemesResponse[number]) => {
    setPendingLikeId(theme.id);
    toggleLike({ themeId: theme.id, liked: !theme.liked });
  };

  return (
    <section className={cx("section")}>
      <div className={cx("headerRow")}>
        <div className={cx("headingGroup")}>
          <span className={cx("eyebrow")}>Hot Right Now</span>
          <h2 className={cx("title")}>요즘 핫한 테마</h2>
        </div>
        {/* TODO: 테마 목록 페이지가 구현되면 실제 라우트로 연결 */}
        <Link href="/themes" className={cx("moreLink")}>
          더보기
          <FiArrowRight aria-hidden />
        </Link>
      </div>

      <div className={cx("carousel")}>
        {pageCount > 1 && (
          <div className={cx("edgeZone", "edgeLeft")}>
            <button
              type="button"
              className={cx("arrowBtn")}
              aria-label="이전 5개 테마 보기"
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
                className={cx("card", { cardOffPage: isOffPage })}
              >
                {/* TODO: 테마 상세 페이지가 구현되면 실제 라우트로 연결 */}
                <Link href={`/themes/${theme.id}`} className={cx("thumbLink")}>
                  <span className={cx("thumb")} aria-hidden>
                    <span className={cx("thumbScrim")} />
                    <span className={cx("rank")}>
                      {String(theme.rank).padStart(2, "0")}
                    </span>
                    <span className={cx("hoverHint")}>
                      <span className={cx("hoverHintLabel")}>
                        해당 테마로 이동
                        <FiArrowRight aria-hidden />
                      </span>
                    </span>
                  </span>
                  <span className={cx("themeName")}>{theme.name}</span>
                </Link>

                <div className={cx("metaRow")}>
                  <span className={cx("branch")}>{theme.branchName}</span>
                  <button
                    type="button"
                    className={cx("heart", { heartLiked: theme.liked })}
                    aria-pressed={theme.liked}
                    aria-label={
                      theme.liked
                        ? `${theme.name} 좋아요 취소`
                        : `${theme.name} 좋아요`
                    }
                    disabled={pendingLikeId === theme.id}
                    onClick={() => handleToggleLike(theme)}
                  >
                    {theme.liked ? (
                      <FaHeart aria-hidden />
                    ) : (
                      <FiHeart aria-hidden />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {pageCount > 1 && (
          <div className={cx("edgeZone", "edgeRight")}>
            <button
              type="button"
              className={cx("arrowBtn")}
              aria-label="다음 5개 테마 보기"
              onClick={goNext}
            >
              <FiChevronRight aria-hidden />
            </button>
          </div>
        )}
      </div>

      {pageCount > 1 && (
        <div className={cx("dots")}>
          {Array.from({ length: pageCount }).map((_, i) => (
            <span
              key={i}
              className={cx("dot", { dotOn: i === page })}
              aria-hidden
            />
          ))}
        </div>
      )}
    </section>
  );
}
