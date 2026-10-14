import type { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import MSWProvider from "@/provider/MSWProvider";
import QueryProvider from "@/provider/QueryProvider";

/**
 * 앱 전역 프로바이더를 한곳에서 조립한다.
 * 새 프로바이더가 생기면 여기에만 추가하면 된다. (바깥일수록 먼저 감쌈)
 */
export default function CoreProvider({ children }: { children: ReactNode }) {
  return (
    <MSWProvider>
      <QueryProvider>{children}</QueryProvider>
      <ToastContainer position="top-center" autoClose={3000} />
    </MSWProvider>
  );
}
