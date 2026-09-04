let mockingPromise: Promise<void> | null = null;

/**
 * MSW 워커를 1회만 기동한다.
 * StrictMode 의 이펙트 이중 호출 등으로 여러 번 불려도 같은 Promise 를 재사용해
 * `worker.start()` 중복 호출("already enabled network")을 막는다.
 */
export function enableApiMocking(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return Promise.resolve();

  mockingPromise ??= import("@/mocks/browser").then(({ worker }) =>
    worker
      .start({
        onUnhandledRequest: "bypass",
        serviceWorker: { url: "/mockServiceWorker.js" },
      })
      .then(() => undefined)
  );

  return mockingPromise;
}
