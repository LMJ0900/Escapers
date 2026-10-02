"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState, type ReactNode } from "react";
import { toast } from "react-toastify";

import { isApiErrorResponse } from "@/api/ApiErrorRes";

const MAX_QUERY_RETRY = 3;

/**
 * 서버가 4xx로 응답한 요청은 재시도해도 결과가 같으므로 재시도하지 않는다.
 * 5xx와 전송 계층 에러(status 0: 오프라인·타임아웃 등)만 재시도한다.
 */
const shouldRetryQuery = (failureCount: number, error: unknown): boolean => {
  if (
    isApiErrorResponse(error) &&
    error.status !== undefined &&
    error.status >= 400 &&
    error.status < 500
  ) {
    return false;
  }

  return failureCount < MAX_QUERY_RETRY;
};

export default function QueryProvider({ children }: { children: ReactNode }) {
  // 렌더마다 새 인스턴스가 생기지 않도록 최초 1회만 생성한다.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: shouldRetryQuery },
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
