/**
 * 이메일은 토큰의 subject라 값이 바뀌면 기존 access/refresh token이 더 이상 계정을
 * 가리키지 못한다. 새 토큰을 발급해 세션을 이어가는 대신, 보안상 더 단순하고 안전한
 * "재로그인" 방식을 쓴다 — 호출부가 성공 후 clearAuthToken 으로 세션을 정리하고
 * 로그인 페이지로 보낸다.
 */
export interface UpdateEmailResponse {
  email: string;
}
