"use client";

import { useEffect, useState, type ReactNode } from "react";

import { enableApiMocking } from "@/mocks/init";

const MOCKING_ENABLED = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

export default function MSWProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!MOCKING_ENABLED);

  useEffect(() => {
    if (!MOCKING_ENABLED) return;
    enableApiMocking().then(() => setReady(true));
  }, []);

  if (!ready) return null;

  return <>{children}</>;
}