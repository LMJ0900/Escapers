"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "react-toastify";

import type { PutThemeLikeErrorResponse } from "@/api/domain/theme/Theme.error";
import { ThemeMutation } from "@/api/domain/theme/Theme.mutation";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { ThemeListItem } from "@/api/domain/theme/Theme.type";
import type { getThemesResponse } from "@/api/domain/theme/getThemes/response/getThemesRes";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";

/**
 * 같은 테마가 핫한 테마/공포 테마/활동성 테마(배열)와 모든 테마(무한 스크롤 페이지) 양쪽
 * 캐시에 동시에 들어있을 수 있어, 좋아요 변경 시 두 모양을 모두 찾아 갱신한다.
 */
function updateLikeInCache(
  prev: unknown,
  themeId: string,
  liked: boolean
): unknown {
  if (Array.isArray(prev)) {
    return (prev as ThemeListItem[]).map((theme) =>
      theme.id === themeId ? { ...theme, liked } : theme
    );
  }
  if (prev && typeof prev === "object" && "pages" in prev) {
    const typed = prev as { pages: getThemesResponse[] };
    return {
      ...typed,
      pages: typed.pages.map((page) => ({
        ...page,
        items: page.items.map((item) =>
          item.id === themeId ? { ...item, liked } : item
        ),
      })),
    };
  }
  return prev;
}

/**
 * 테마 좋아요 토글. 핫한 테마 캐러셀이든 모든 테마(필터·무한 스크롤) 목록이든
 * 같은 원리(캐시 동기화 + 로그인 필요 안내 토스트)로 동작해서 한 군데서 처리한다.
 */
export function useThemeLike() {
  const queryClient = useQueryClient();
  const [pendingLikeId, setPendingLikeId] = useState<string | null>(null);

  const { mutate } = useMutation<
    PutThemeLikeResponse,
    PutThemeLikeErrorResponse,
    { themeId: string; liked: boolean }
  >({
    mutationFn: ThemeMutation.putLike,
    onSuccess: (_, variables) => {
      // 같은 테마가 여러 목록에 동시에 있을 수 있어 모든 테마 목록 캐시를 갱신한다.
      queryClient.setQueriesData<unknown>(
        { queryKey: ThemeQuery.themeListQueryKey },
        (prev: unknown) =>
          updateLikeInCache(prev, variables.themeId, variables.liked)
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

  const toggleLike = (themeId: string, liked: boolean) => {
    setPendingLikeId(themeId);
    mutate({ themeId, liked: !liked });
  };

  return { pendingLikeId, toggleLike };
}
