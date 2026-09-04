export async function enableApiMocking(): Promise<void> {
  if (typeof window === "undefined") return;
  if (process.env.NEXT_PUBLIC_API_MOCKING !== "enabled") return;

  const { worker } = await import("@/mocks/browser");
  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}