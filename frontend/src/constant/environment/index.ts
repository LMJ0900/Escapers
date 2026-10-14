/** API 베이스 URL. 목킹 시엔 빈 문자열 → 같은 오리진 요청을 서비스워커가 가로챈다. */
export const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

/** MSW 목킹 활성화 여부. */
export const IS_API_MOCKING = process.env.NEXT_PUBLIC_API_MOCKING === "enabled";
