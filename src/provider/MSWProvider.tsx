"use client";

import { useEffect, useState, type ReactNode } from "react";

import { enableApiMocking } from "@/mocks/init";

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export default function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!MOCKING_ENABLED);

  useEffect(() => {
    if (!MOCKING_ENABLED) return;
    // 목킹 기동에 실패해도 앱은 렌더한다(빈 화면 방지).
    enableApiMocking()
      .catch((err) => console.error("[MSW] 목킹 기동 실패:", err))
      .finally(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}