"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { clearAuthToken } from "@/api/domain/auth/Auth.action";
import { useQueryClient } from "@tanstack/react-query";
import { UserQuery } from "@/api/domain/user/User.query";

const REASON_MESSAGE: Record<string, string> = {
  suspended: "이용이 제한된 계정입니다. 자세한 내용은 고객센터로 문의해주세요.",
  withdrawn: "탈퇴한 계정입니다.",
  expired: "다시 로그인해주세요.",
};

type LogoutHandlerProps = {
  reason?: string;
};

/**
 * 세션 쿠키를 정리하고(clearAuthToken) 로그인 페이지로 돌려보낸다.
 * - 일반 로그아웃: 사유 없이 이 페이지로 이동
 * - 강제 로그아웃: (protected)의 verifySession()이 정지·탈퇴를, ApiClient.ts 응답
 *   인터셉터가 refreshToken 재발급 실패(만료)를 감지해 reason과 함께 이동
 * 쿠키 삭제는 Server Action이 클라이언트에서 호출될 때만 가능해서
 * (Server Component 렌더링 중에는 불가) 여기서 처리한다.
 */
export default function LogoutHandler({ reason }: LogoutHandlerProps) {
  const router = useRouter();
  const ranRef = useRef(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    (async () => {
      await clearAuthToken();
      queryClient.setQueryData(UserQuery.getMeQueryKey, null);
      const message = reason ? REASON_MESSAGE[reason] : undefined;
      if (message) toast.error(message);

      router.replace("/auth/login");
    })();
  }, [reason, router]);

  return null;
}
