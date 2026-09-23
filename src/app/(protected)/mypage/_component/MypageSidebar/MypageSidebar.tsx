"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { UserQuery } from "@/api/domain/user/User.query";
import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./MypageSidebar.module.css";

const cx = bindClassNames(styles);

const ROLE_LABEL: Record<getMeResponse["role"], string> = {
  MEMBER: "일반 회원",
  OWNER: "사장님",
  ADMIN: "관리자",
};

const NAV_ITEMS = [
  { label: "회원정보", href: "/mypage" },
  { label: "예약 내역", href: "/mypage/reservations" },
];

type MypageSidebarProps = {
  initialMe: getMeResponse;
};

export default function MypageSidebar({ initialMe }: MypageSidebarProps) {
  const pathname = usePathname();

  const { data: me } = useQuery({
    queryKey: UserQuery.getMeQueryKey,
    queryFn: () => UserQuery.getMe(),
    initialData: initialMe,
  });

  return (
    <div className={cx("root")}>
      <div className={cx("profile")}>
        <div className={cx("avatar")} aria-hidden>
          {me.nickname.charAt(0)}
        </div>
        <div>
          <p className={cx("nickname")}>{me.nickname}</p>
          <p className={cx("email")}>{me.email}</p>
        </div>
        <span className={cx("roleTag")}>{ROLE_LABEL[me.role]}</span>
      </div>

      <nav className={cx("nav")}>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cx("navItem", { navItemActive: pathname === item.href })}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <Link href="/auth/logout" prefetch={false} className={cx("logout")}>
        로그아웃
      </Link>
    </div>
  );
}
