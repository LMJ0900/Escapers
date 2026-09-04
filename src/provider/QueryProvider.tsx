"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";

import { isApiErrorResponse } from "@/api/ApiErrorRes";

export default function QueryProvider({ children }: { children: ReactNode }) {
  // 렌더마다 새 인스턴스가 생기지 않도록 최초 1회만 생성한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 3 },
          mutations: {
            retry: 0,
            // 개별 onError 를 안 준 mutation 실패 시 공통으로 toast 노출.
            // (호출부가 자체 onError 를 주면 이 기본값은 대체된다.)
            onError: (error) => {
              if (isApiErrorResponse(error)) toast.error(error.message);
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
