import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 워크스페이스 공용 패키지는 빌드 없이 TS 소스를 내보내므로 Next 가 트랜스파일한다.
  transpilePackages: ["@escapers/shared"],
  // MSW(msw/node)가 Node의 http/fetch를 patch하는 방식이 Turbopack 번들링과 충돌해
  // 서버 사이드(RSC/Server Action/Proxy) 목킹이 깨지므로, 개발 환경에서만 번들링 대상에서 제외한다.
  ...(process.env.NODE_ENV === "development" && {
    serverExternalPackages: ["msw"],
  }),
};

export default nextConfig;
