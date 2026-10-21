"use client";

import { useQuery } from "@tanstack/react-query";
import { FaHeart } from "react-icons/fa";
import { FiHeart, FiShare } from "react-icons/fi";
import { toast } from "react-toastify";

import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { getThemeDetailResponse } from "@/api/domain/theme/getThemeDetail/response/getThemeDetailRes";
import { useThemeLike } from "@/hooks/useThemeLike";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThemeActions.module.css";

const cx = bindClassNames(styles);

type ThemeActionsProps = {
  initialTheme: getThemeDetailResponse;
};

/** 좋아요 / 공유 버튼. 좋아요 상태와 개수는 상세 캐시에서 읽어 `useThemeLike` 가 갱신한다. */
export default function ThemeActions({ initialTheme }: ThemeActionsProps) {
  const { data: theme } = useQuery({
    queryKey: ThemeQuery.getThemeDetailQueryKey(initialTheme.id),
    queryFn: () => ThemeQuery.getThemeDetail(initialTheme.id),
    initialData: initialTheme,
  });
  const { pendingLikeId, toggleLike } = useThemeLike();

  const handleShare = async () => {
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: theme.name, url });
      } catch {
        // 사용자가 공유 창을 닫은 경우라 따로 안내하지 않는다.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사됐어요.");
    } catch {
      toast.error("링크를 복사하지 못했어요.");
    }
  };

  return (
    <div className={cx("root")}>
      <button
        type="button"
        className={cx("button", { buttonLiked: theme.liked })}
        aria-pressed={theme.liked}
        disabled={pendingLikeId === theme.id}
        onClick={() => toggleLike(theme.id, theme.liked)}
      >
        {theme.liked ? <FaHeart aria-hidden /> : <FiHeart aria-hidden />}
        좋아요 {theme.likeCount.toLocaleString("ko-KR")}
      </button>
      <button type="button" className={cx("button")} onClick={handleShare}>
        <FiShare aria-hidden />
        공유
      </button>
    </div>
  );
}
