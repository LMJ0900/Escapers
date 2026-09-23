"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { FiSearch, FiUser } from "react-icons/fi";

import { UserQuery } from "@/api/domain/user/User.query";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./HeaderActions.module.css";

const cx = bindClassNames(styles);

type HeaderActionsProps = {
  initialMe: getMeResponse | null;
};

export default function HeaderActions({ initialMe }: HeaderActionsProps) {
  const { data: me } = useQuery({
    queryKey: UserQuery.getMeQueryKey,
    queryFn: () => UserQuery.getMe(),
    initialData: initialMe ?? undefined,
  });

  return (
    <div className={cx("root")}>
      {/* TODO: 검색 UI 연결 (오버레이 or 검색 페이지) */}
      <button type="button" className={cx("iconButton")} aria-label="검색">
        <FiSearch size={18} aria-hidden />
      </button>

      {me ? (
        <Link href="/mypage" className={cx("iconButton")} aria-label="내 정보">
          <FiUser size={18} aria-hidden />
        </Link>
      ) : (
        <Link href="/auth/login" className={cx("login")}>
          로그인
        </Link>
      )}
    </div>
  );
}
