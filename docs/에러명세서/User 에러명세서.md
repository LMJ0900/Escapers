# User(유저) 에러 명세서

| 항목      | 내용                                                                       |
| --------- | -------------------------------------------------------------------------- |
| 문서명    | 유저(`user`) 도메인 API 에러 코드 · 메시지 명세                            |
| 버전      | v0.1 (초안)                                                                |
| 작성일    | 2026-09-15                                                                 |
| 대상 독자 | 프론트엔드 / 백엔드 / QA                                                   |
| 적용 범위 | `user` 도메인의 모든 API. 메서드가 추가될 때마다 §3 에 하위 절을 추가한다. |

관련 문서 · 코드

- 공통 응답/에러 포맷: [공통 에러 명세서](./공통%20에러%20명세서.md)
- 요청: [`src/api/domain/user/User.query.ts`](../../src/api/domain/user/User.query.ts)
- 세션 검증(서버 컴포넌트): [`src/api/domain/auth/Auth.session.ts`](../../src/api/domain/auth/Auth.session.ts) (`verifySession`)

---

## 1. 이 문서의 구성

`user` 도메인은 `getMe` 를 시작으로 앞으로 프로필 수정 · 탈퇴 등 메서드가 늘어난다. 모든 메서드가 **로그인(유효한 access token)을 전제**로 하는 만큼, 인증 실패 시 나오는 에러(토큰 없음/만료, 계정 정지/탈퇴 등)는 메서드마다 반복 정의하지 않고 **§2 에 도메인 공통 에러로 한 번만** 정의한다. 메서드별 절(§3.x)에는 그 메서드에서만 나는 고유 에러만 적는다.

새 메서드를 추가할 때:

1. 해당 메서드가 §2 의 공통 인증 에러를 그대로 따르는지, 예외가 있는지(예: 인증 불필요 엔드포인트) 확인하고 §2.1 표에 한 줄 추가한다.
2. §3 밑에 `### 3.N <메서드명> (\`<HTTP METHOD> <path>\`)` 형태로 하위 절을 추가하고, 그 메서드 고유의 에러만 표로 정리한다.
3. §4 QA 체크리스트에 해당 메서드 케이스를 추가한다.

---

## 2. 도메인 공통 사항

### 2.1 메서드 목록 · 인증 요구사항

| 메서드                 | 엔드포인트                    | 인증 필요 | 상태     |
| ---------------------- | ----------------------------- | --------- | -------- |
| `getMe`                | `GET /user/getMe`             | 필요      | 구현     |
| `updateNickname`       | `PATCH /user/nickname`        | 필요      | 구현(목) |
| `updateEmail`          | `PATCH /user/email`           | 필요      | 구현(목) |
| `updatePassword`       | `PATCH /user/password`        | 필요      | 구현(목) |
| `updateMarketingAgree` | `PATCH /user/marketing-agree` | 필요      | 구현(목) |
| `withdraw`             | `DELETE /user/me`             | 필요      | 구현(목) |

> 인증이 필요 없는 `user` 엔드포인트(예: 공개 프로필 조회)가 추가되면 이 표에 "인증 필요: 불필요"로 표시하고, 해당 메서드 절(§3.x)에서 §2.2 를 상속하지 않는다고 명시한다.

### 2.2 공통 인증 에러 (인증이 필요한 모든 메서드에 적용)

아래는 `error` 객체 필드(`code`/`message`/`status`, [공통 에러 명세서 §3](./공통%20에러%20명세서.md#3-error-객체))를 따르는, **인증이 필요한 모든 `user` 메서드에서 공통으로 발생**할 수 있는 에러다. 각 메서드 절에서는 별도 언급이 없는 한 이 표가 그대로 적용된다.

```ts
// src/api/domain/user/User.error.ts
import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type UserAuthErrorCode =
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_ACCOUNT_SUSPENDED"
  | "AUTH_ACCOUNT_WITHDRAWN";

export type UserAuthErrorResponse = ApiErrorResponse<UserAuthErrorCode>;
```

| HTTP | code                     | 발생 조건                                                                | 사용자 메시지                                       | 프론트 처리                                                                  | 상태 |
| ---- | ------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------- | ---------------------------------------------------------------------------- | ---- |
| 401  | `AUTH_TOKEN_MISSING`     | `Authorization` 헤더 없음(비로그인 상태로 호출)                          | 로그인이 필요합니다.                                | `verifySession` 이 `/auth/logout` 으로 리다이렉트(강제 로그아웃 경로 재사용) | 구현 |
| 401  | `AUTH_TOKEN_INVALID`     | 토큰 서명/형식 불일치(변조 · 다른 서비스 토큰 등)                        | 인증 정보가 올바르지 않습니다. 다시 로그인해주세요. | 동일                                                                         | 예정 |
| 401  | `AUTH_TOKEN_EXPIRED`     | access token 만료(그리고 refresh 재발급도 실패했거나 시도하지 않은 경우) | 로그인이 만료되었습니다. 다시 로그인해주세요.       | 동일                                                                         | 예정 |
| 403  | `AUTH_ACCOUNT_SUSPENDED` | 토큰은 유효하나 `User.status = suspended`(`FR-ADM-03`)                   | 이용이 제한된 계정입니다. 고객센터로 문의해주세요.  | `verifySession` 이 `/auth/logout?reason=suspended` 로 강제 로그아웃          | 구현 |
| 403  | `AUTH_ACCOUNT_WITHDRAWN` | 토큰은 유효하나 `User.status = withdrawn`(`FR-AUTH-09`)                  | 탈퇴한 계정입니다.                                  | `verifySession` 이 `/auth/logout?reason=withdrawn` 으로 강제 로그아웃        | 구현 |

#### 케이스 노트

- **모든 401 은 `verifySession` 에서 코드와 무관하게 강제 로그아웃 대상이다.** [`Auth.session.ts`](../../src/api/domain/auth/Auth.session.ts) 의 `shouldForceLogout` 은 `err.status === 401` 이면 `code` 매핑(`AUTH_LOGOUT_REASON_BY_CODE`) 유무와 상관없이 `/auth/logout` 으로 보낸다. 즉 `AUTH_TOKEN_INVALID` · `AUTH_TOKEN_EXPIRED` · `AUTH_TOKEN_MISSING` 을 따로 분기할 필요는 없으며, 셋을 나눈 것은 로그 · QA 재현용이다.
- **403 은 `code` 로 사유(`suspended`/`withdrawn`)를 구분해 쿼리스트링으로 넘긴다** (`AUTH_LOGOUT_REASON_BY_CODE`). 새 정지/탈퇴 사유 코드를 추가하면 이 표와 `Auth.session.ts` 의 매핑을 함께 갱신한다.
- 클라이언트에서 직접 호출하는 [`HeaderActions`](../../src/components/Header/_components/HeaderActions/HeaderActions.tsx) 는 `useQuery` 로 감싸 실패를 조용히 무시(`me` 가 `undefined` 면 로그인 버튼 노출)한다 — 여기서는 강제 리다이렉트를 하지 않는다. **강제 로그아웃은 서버 컴포넌트 경로(`verifySession`)에서만** 일어난다.

### 2.3 네트워크 / 시스템 에러

전송 계층 또는 서버 5xx. `code` 정의 · 판별 · 합성 규칙은 [공통 에러 명세서 §6](./공통%20에러%20명세서.md#6-전송-계층네트워크-에러)을 그대로 따른다.

> **중요**: 5xx · 네트워크 오류를 401/403 과 동일하게 강제 로그아웃시키면 안 된다. 서버 장애로 로그인 세션이 전부 끊기는 것을 막기 위해 `verifySession` 은 §2.2 표의 코드(401/매핑된 403)일 때만 리다이렉트하고, 그 외에는 그대로 `throw` 해 상위 에러 바운더리가 처리하도록 한다.

---

## 3. 메서드별 에러

### 3.1 getMe (`GET /user/getMe`)

로그인된 사용자 본인의 정보(`id` · `role` · `email` · `nickname`)를 [`getMeResponse`](../../src/api/domain/user/getMe/response/getMeRes.ts) 형태로 반환한다. §2.2 의 공통 인증 에러가 모두 적용되며, 아래는 `getMe` 고유의 추가 에러다.

```ts
// src/api/domain/user/getMe/response/getMeRes.ts (추가 예정)
import type { ApiErrorResponse } from "@/api/ApiErrorRes";
import type { UserAuthErrorCode } from "@/api/domain/user/User.error";

export type GetMeErrorCode = UserAuthErrorCode | "USER_NOT_FOUND";
export type GetMeErrorResponse = ApiErrorResponse<GetMeErrorCode>;
```

| HTTP | code             | 발생 조건                                                                       | 사용자 메시지                                      | 프론트 처리                                | 상태 |
| ---- | ---------------- | ------------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------ | ---- |
| 404  | `USER_NOT_FOUND` | 토큰의 subject(user id)에 해당하는 계정이 실제로 없음(하드 삭제 등 예외적 상황) | 계정 정보를 찾을 수 없습니다. 다시 로그인해주세요. | 401 과 동일하게 취급 — 강제 로그아웃(예정) | 예정 |

#### 케이스 노트

- **`USER_NOT_FOUND` 는 401 처럼 처리한다.** 토큰 자체는 서명상 유효해도 가리키는 사용자가 없으면 "인증되지 않은 상태"와 동일하게 다뤄야 하므로, `verifySession` 확장 시 `shouldForceLogout` 조건에 `err.code === "USER_NOT_FOUND"` 를 추가하는 방안을 검토한다(현재는 미반영 — §6 미결 사항 1).

### 3.2 updateNickname (`PATCH /user/nickname`)

닉네임을 변경한다. 성공 시 최신 [`getMeResponse`](../../src/api/domain/user/getMe/response/getMeRes.ts)를 반환한다. 이메일과 달리 토큰 subject 에 영향이 없어 토큰 재발급은 없다. §2.2 의 공통 인증 에러가 모두 적용되며, 아래는 `updateNickname` 고유의 추가 에러다.

```ts
// src/api/domain/user/User.error.ts
export type UpdateNicknameErrorCode =
  UserAuthErrorCode | "USER_NICKNAME_DUPLICATE";
```

| HTTP | code                      | 발생 조건                                             | 사용자 메시지                | 프론트 처리                 | 상태     |
| ---- | ------------------------- | ----------------------------------------------------- | ---------------------------- | --------------------------- | -------- |
| 409  | `USER_NICKNAME_DUPLICATE` | 다른 계정이 이미 쓰는 닉네임(본인 현재 닉네임은 제외) | 이미 사용 중인 닉네임이에요. | `nickname` 필드 인라인 에러 | 구현(목) |

#### 케이스 노트

- 요청한 닉네임이 현재 닉네임과 같으면 중복 검사를 건너뛰고 그대로 성공 처리한다(목 핸들러 기준).
- `FR-PROF-04`가 언급하는 "변경 주기 제한(예: 30일 1회)"은 현재 구현하지 않았다 — 정책이 확정되지 않아 §5 미결 사항으로 남겨둔다. 재도입 시 이 표에 `USER_NICKNAME_CHANGE_LIMITED` 를 다시 추가한다.

### 3.3 updateEmail (`PATCH /user/email`)

이메일을 변경한다. 이메일은 토큰의 subject라 값이 바뀌면 기존 access/refresh token 이 더 이상 계정을 가리키지 못한다. 새 토큰을 발급해 세션을 이어가는 방식(로그인 응답처럼)도 검토했으나, 프로텍티드 라우트에서 서버 액션(`setAuthToken`) 호출 시 Next.js가 함께 트리거하는 현재 라우트의 암묵적 리렌더가 **이 액션 자체의 쿠키 변경이 적용되기 전의(이전) 쿠키**로 실행돼, `verifySession`이 곧바로 401로 강제 로그아웃시키는 문제가 있었다(재현: 이메일 변경 성공 직후 `/mypage`에서 `AUTH_TOKEN_INVALID`로 즉시 튕김). 그래서 성공 시 [`UpdateEmailResponse`](../../src/api/domain/user/updateEmail/response/UpdateEmailRes.ts)는 새 이메일만 반환하고, 호출부가 `clearAuthToken`으로 세션을 정리한 뒤 로그인 페이지로 보낸다(재로그인 유도). §2.2 의 공통 인증 에러가 모두 적용되며, 아래는 `updateEmail` 고유의 추가 에러다.

```ts
// src/api/domain/user/User.error.ts
export type UpdateEmailErrorCode = UserAuthErrorCode | "USER_EMAIL_DUPLICATE";
```

| HTTP | code                   | 발생 조건                    | 사용자 메시지                | 프론트 처리              | 상태     |
| ---- | ---------------------- | ---------------------------- | ---------------------------- | ------------------------ | -------- |
| 409  | `USER_EMAIL_DUPLICATE` | 다른 계정이 이미 쓰는 이메일 | 이미 사용 중인 이메일이에요. | `email` 필드 인라인 에러 | 구현(목) |

#### 케이스 노트

- 현재는 새 이메일로 즉시 전환한다 — 실제 백엔드에서는 재인증(이메일 인증 메일) 절차가 붙을 가능성이 높다(§5 미결 사항 참고).

### 3.4 updatePassword (`PATCH /user/password`)

현재 비밀번호를 확인한 뒤 새 비밀번호로 바꾼다. 성공 시 `null`. §2.2 의 공통 인증 에러가 모두 적용되며, 아래는 `updatePassword` 고유의 추가 에러다.

```ts
// src/api/domain/user/User.error.ts
export type UpdatePasswordErrorCode =
  UserAuthErrorCode | "USER_CURRENT_PASSWORD_MISMATCH";
```

| HTTP | code                             | 발생 조건                     | 사용자 메시지                      | 프론트 처리                        | 상태     |
| ---- | -------------------------------- | ----------------------------- | ---------------------------------- | ---------------------------------- | -------- |
| 401  | `USER_CURRENT_PASSWORD_MISMATCH` | 입력한 현재 비밀번호가 불일치 | 현재 비밀번호가 올바르지 않습니다. | `currentPassword` 필드 인라인 에러 | 구현(목) |

### 3.5 updateMarketingAgree (`PATCH /user/marketing-agree`)

마케팅 정보 수신 동의 여부를 토글한다. 성공 시 최신 `getMeResponse`. §2.2 의 공통 인증 에러 외 고유 에러는 없다.

### 3.6 withdraw (`DELETE /user/me`)

회원 탈퇴(`FR-AUTH-09`). 목에서는 계정을 즉시 하드 삭제한다. 성공 시 `null`이며, 호출부가 `clearAuthToken` 으로 세션 쿠키를 정리해야 한다. §2.2 의 공통 인증 에러 외 고유 에러는 없다.

---

## 4. QA 체크리스트

### 4.1 공통 인증 (§2.2, 인증이 필요한 모든 메서드에 적용)

- [ ] 토큰 없이 호출(비로그인 상태로 보호된 페이지 접근) → `/auth/logout` 로 리다이렉트
- [ ] 만료된 access token 으로 호출 → 401 → 강제 로그아웃
- [ ] 변조된/다른 서비스 토큰으로 호출 → 401 → 강제 로그아웃
- [ ] `suspended` 계정 토큰으로 호출 → `/auth/logout?reason=suspended`
- [ ] `withdrawn` 계정 토큰으로 호출 → `/auth/logout?reason=withdrawn`
- [ ] 서버 500 목 → 강제 로그아웃 **아님**, 에러 바운더리 노출 확인
- [ ] 오프라인 상태에서 보호된 페이지 진입 → 강제 로그아웃 아님, 재시도 유도

### 4.2 getMe

- [ ] [`HeaderActions`](../../src/components/Header/_components/HeaderActions/HeaderActions.tsx) 클라이언트 호출 실패 시 리다이렉트 없이 로그인 버튼만 노출되는지

### 4.3 updateNickname

- [ ] 본인 현재 닉네임과 같은 값으로 제출 → 중복 검사 없이 성공
- [ ] 다른 계정이 쓰는 닉네임 → `USER_NICKNAME_DUPLICATE` 인라인 에러

### 4.4 updateEmail

- [ ] 다른 계정이 쓰는 이메일 → `USER_EMAIL_DUPLICATE` 인라인 에러
- [ ] 성공 후 세션이 정리되고 로그인 페이지로 이동하는지, 새 이메일로 재로그인이 되는지

### 4.5 updatePassword

- [ ] 현재 비밀번호 오입력 → `USER_CURRENT_PASSWORD_MISMATCH` 인라인 에러
- [ ] 성공 후 새 비밀번호로 재로그인되는지

### 4.6 withdraw

- [ ] 탈퇴 확인 다이얼로그에서 취소 시 아무 일도 일어나지 않는지
- [ ] 탈퇴 성공 후 세션이 정리되고 로그인 페이지로 이동하는지
- [ ] 탈퇴한 이메일로 재가입이 가능한지(목 스토어 기준)

---

## 5. 미결 사항

1. `updateEmail`은 현재 즉시 전환한다. 실제 백엔드에서는 새 이메일 인증(재확인 메일) 절차를 거친 뒤에만 전환되도록 바뀔 수 있다 — 그 경우 "인증 대기 중" 상태와 별도 확인 엔드포인트가 필요하다.
2. `updateNickname`의 변경 주기 제한(`FR-PROF-04`가 예시로 든 "30일 1회")은 **논의 후 제거했다** — 정책이 확정되지 않은 채 임의 값(30일)을 코드에 박아두는 것이 부적절하다고 판단했다. 현재는 제한 없이 자유롭게 변경 가능하다. 정책이 확정되면 `UpdateNicknameErrorCode`에 `USER_NICKNAME_CHANGE_LIMITED`를 다시 추가하고 목 핸들러에 쿨다운 검사를 재도입한다. 요구사항 문서 쪽 논의는 [`요구사항명세서.md` §11](../요구사항명세서.md#11-미결-사항-확정-필요) 참고.
3. `withdraw`는 목에서 개인정보를 하드 삭제한다. `FR-AUTH-09`가 요구하는 "작성 콘텐츠는 익명화 후 보존"은 콘텐츠(리뷰/댓글) 도메인이 생기기 전이라 아직 반영하지 않았다.

---

## 변경 이력

| 버전 | 일자       | 내용                                                                                                             |
| ---- | ---------- | ---------------------------------------------------------------------------------------------------------------- |
| v0.1 | 2026-09-15 | `user` 도메인 공통 문서 초안 작성                                                                                |
| v0.2 | 2026-09-18 | 마이페이지 구현에 맞춰 `updateNickname`/`updateEmail`/`updatePassword`/`updateMarketingAgree`/`withdraw` 추가    |
| v0.3 | 2026-09-23 | `updateNickname`의 30일 변경 주기 제한을 논의 후 제거(`USER_NICKNAME_CHANGE_LIMITED` 삭제) — §5 미결 사항 2 참고 |
