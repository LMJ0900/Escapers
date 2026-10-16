"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";

import { AUTH_REASON_MESSAGE } from "@/api/constant/Reason";

type LoginReasonToastProps = {
  reason?: string;
};

/**
 * verifySession()이 세션 없음(reason=required) 등을 이유로
 * /auth/login?reason=...으로 보냈을 때 사유를 toast로 안내한다.
 * 안내 후 쿼리파라미터를 지워 새로고침·뒤로가기 시 다시 뜨지 않게 한다.
 */
export default function LoginReasonToast({ reason }: LoginReasonToastProps) {
  const router = useRouter();
  const shownRef = useRef(false);

  useEffect(() => {
    if (shownRef.current || !reason) return;
    shownRef.current = true;

    const message = AUTH_REASON_MESSAGE[reason];
    if (message) toast.error(message);

    router.replace("/auth/login");
  }, [reason, router]);

  return null;
}
