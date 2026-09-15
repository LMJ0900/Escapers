import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/api/domain/auth/Auth.session";

/** 비로그인 상태에서는 접근 불가한 화면을 감싼다. */
export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn } = await getAuthSession();

  if (!isLoggedIn) {
    redirect("/auth/login");
  }

  return children;
}
