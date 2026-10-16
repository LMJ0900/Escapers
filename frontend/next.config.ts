import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 워크스페이스 공용 패키지는 빌드 없이 TS 소스를 내보내므로 Next 가 트랜스파일한다.
  transpilePackages: ["@escapers/shared"],
  // 테마 포스터는 크롤링한 원본 URL을 그대로 저장하고, Next 이미지 최적화가 프록시·리사이즈·캐시를 맡는다.
  // 허용 목록 밖의 URL은 400으로 막히므로, 크롤링 소스(어댑터)를 추가하면 여기에도 이미지 호스트를 추가한다.
  images: {
    remotePatterns: [
      // zeroworld
      new URL("https://zeroworldkorea.com/file/theme/**"),
      // jigubyeol (지구별방탈출.com)
      new URL("https://xn--2e0b040a4xj.com/storage/theme/**"),
      // nextedition
      new URL("https://img.reserv.company/nextedition/**"),
    ],
    // 원본이 바뀌어도 캐시를 무효화할 방법이 없어 하루로 둔다. (기본값 4시간)
    minimumCacheTTL: 60 * 60 * 24,
  },
  // MSW(msw/node)가 Node의 http/fetch를 patch하는 방식이 Turbopack 번들링과 충돌해
  // 서버 사이드(RSC/Server Action/Proxy) 목킹이 깨지므로, 개발 환경에서만 번들링 대상에서 제외한다.
  ...(process.env.NODE_ENV === "development" && {
    serverExternalPackages: ["msw"],
  }),
};

export default nextConfig;
