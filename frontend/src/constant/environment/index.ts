/** API 베이스 URL. 목킹 시엔 빈 문자열 → 같은 오리진 요청을 서비스워커가 가로챈다. */
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** MSW 목킹 활성화 여부. */
export const IS_API_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";

/**
 * 카카오맵 JavaScript 키. 브라우저에 노출되는 키라 카카오 개발자 콘솔에서 허용 도메인을 제한해야 한다.
 * 비어 있으면 지도 대신 주소만 보여주는 폴백 화면이 뜬다.
 */
export const KAKAO_MAP_APP_KEY =
  process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY ?? "";
