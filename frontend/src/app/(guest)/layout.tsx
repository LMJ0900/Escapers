import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/api/domain/auth/Auth.session";

/** 로그인 상태에서는 접근 불가한 화면(로그인/회원가입 등)을 감싼다. */
export default async function GuestLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { isLoggedIn } = await getAuthSession();

  if (isLoggedIn) {
    redirect("/");
  }

  return children;
}
