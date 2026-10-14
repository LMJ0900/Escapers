import type { ReactNode } from "react";

import { verifySession } from "@/api/domain/auth/Auth.session";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await verifySession();

  return children;
}
