# Escapers — 방탈출 리뷰 사이트

Next.js 16 (App Router) · React 19 · TanStack Query v5 · TypeScript · CSS (전역 CSS + CSS Modules)

## 모노레포

npm workspaces 로 구성한다. 의존성 설치·스크립트 실행은 항상 **루트**에서 한다.

- 요구 환경: **Node.js 24 LTS 권장** (최소 22.22 / 24.15 — NestJS 12 CLI 요구사항), TypeScript ~6.0 (전 워크스페이스 공통).
  NestJS 12 는 ESM 전용 패키지라 CommonJS 백엔드가 `require(esm)` 으로 불러오며, 이는 Node 22.12+ 에서만 기본 지원된다.

```
Escapers/
├─ frontend/          @escapers/frontend — Next.js (App Router)
├─ backend/           @escapers/backend  — NestJS 12 (Fastify) API 서버 · 워커 (docs/백엔드명세서.md)
├─ shared/            @escapers/shared   — 프론트·백엔드 공용 zod 스키마 · DTO 타입 · 에러 코드
├─ docs/
├─ package.json       workspaces: ["frontend", "backend", "shared"]
└─ tsconfig.base.json 워크스페이스 공통 컴파일러 옵션 (각 tsconfig.json 이 extends)
```

- 특정 워크스페이스에 의존성 추가: `npm install <pkg> -w @escapers/frontend`
- TypeScript 는 typescript-eslint 지원 범위(<6.1)에 맞춰 `~6.0` 으로 고정한다.
- `shared` 는 빌드 없이 TS 소스(`shared/src/index.ts`)를 그대로 내보낸다. 프론트는
  `next.config.ts` 의 `transpilePackages` 로 트랜스파일한다.
- 아래 "Lint & 포맷" 이후 절의 `src/` · `scripts/` 등 경로는 별도 표기가 없으면 `frontend/` 기준이다.

## 개발

```bash
npm install
npm run dev:front        # http://localhost:3000 (실제 백엔드 연결)
npm run dev:front:mock   # http://localhost:3000 (MSW 목킹, 백엔드 불필요)
npm run dev:back         # http://localhost:4000 (backend/.env 필요, 아래 "백엔드" 참고)
```

| 스크립트 (루트에서 실행)  | 설명                                                    |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev:front`       | 프론트 개발 서버 (실제 백엔드 연결)                     |
| `npm run dev:front:mock`  | 프론트 개발 서버 (MSW 목킹, 아래 "API 목킹" 참고)       |
| `npm run dev:back`        | 백엔드 API 개발 서버 (watch)                            |
| `npm run build`           | 전체 워크스페이스 프로덕션 빌드                         |
| `npm run lint`            | 전체 워크스페이스 ESLint                                |
| `npm run typecheck`       | 전체 워크스페이스 `tsc --noEmit` 타입 검사              |
| `npm run format`          | Prettier 로 전체 포맷팅                                 |
| `npm run format:check`    | 포맷 위반만 검사 (CI 용)                                |
| `npm run createComponent` | 컴포넌트 폴더 스캐폴드 생성 (아래 "컴포넌트 생성" 참고) |

워크스페이스 전용 스크립트는 `-w` 로 실행한다 (예: `npm run start -w @escapers/frontend`).
`dev:front:mock` 은 뒤에 붙인 인자를 `next dev` 로 넘긴다 (예: `npm run dev:front:mock -- -p 3001`).

## 백엔드

`backend/` — NestJS 12 + Fastify 어댑터. 상세 설계는 [백엔드 명세서](docs/백엔드명세서.md).
API 서버와 워커는 같은 코드베이스에서 엔트리포인트만 나눈다.

```bash
docker compose up -d                          # PostgreSQL (루트 docker-compose.yml)
cp backend/.env.example backend/.env
npm run prisma:migrate -w @escapers/backend   # 최초 1회 · 스키마 변경 시 (마이그레이션 생성·적용)
npm run dev:back                              # API (src/main.ts, watch)
npm run worker:dev -w @escapers/backend       # 워커 (src/worker.ts, watch)
```

- Prisma 7 (`prisma-client` 제너레이터, CommonJS 출력)을 쓴다. 클라이언트는 `src/generated/prisma/` 에
  생성되며 커밋하지 않는다. `npm install` · `dev` · `build` · `typecheck` 가 `prisma generate` 를 먼저 실행한다.
- 모든 응답은 `{ result, data, error }` 엔벨로프로 나간다. 성공은 `ApiResponseInterceptor`,
  실패는 `GlobalExceptionFilter` 가 감싼다. 비즈니스 에러는 `AppException(<도메인>_ERROR.X)` 로 던진다.

| 파일 / 폴더             | 역할                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| `src/main.ts`           | API 서버 엔트리. Fastify 어댑터, CORS(프론트 오리진만), 종료 훅                                               |
| `src/worker.ts`         | 워커 엔트리. HTTP 없이 애플리케이션 컨텍스트만 기동 (`WorkerModule`)                                          |
| `src/crawl.ts`          | 테마 크롤러 수동 실행 CLI (아래 "테마 크롤러")                                                                |
| `src/crawl-slots.ts`    | 빈자리 크롤러 수동 실행 CLI (아래 "빈자리 크롤러")                                                            |
| `src/app.module.ts`     | API 루트 모듈. 전역 응답 인터셉터 · 예외 필터 등록                                                            |
| `src/common/`           | 응답 엔벨로프(`response/`) · `AppException`·전역 예외 필터(`exception/`) · `ZodValidationPipe`(`validation/`) |
| `src/infra/prisma/`     | `PrismaService` (전역 모듈, `@prisma/adapter-pg`)                                                             |
| `src/config/`           | 환경변수 zod 스키마(`env.ts`) · 공용 `AppConfigModule`. 검증 실패 시 종료                                     |
| `src/modules/<도메인>/` | 기능 모듈. `auth/`(signup·login·reissue·logout, 액세스 토큰 가드 · `@CurrentUser`), `user/`(getMe·정보 수정·탈퇴), `theme/`(목록·컬렉션·좋아요), `reservation/`(빈 틀), `health/` |
| `src/modules/crawler/`  | 테마 · 빈자리 크롤러. `adapters/`(브랜드별 어댑터 · 레지스트리), `http/`(`PoliteFetcher` — robots.txt · 요청 간격 · 차단 감지), `normalize/`(장르·난이도·지역 · 슬롯 시각 정규화), `theme-crawl.service.ts` · `slot-crawl.service.ts`(검증 · 저장), `crawl-run.ts`(`CrawlRun` 기록 헬퍼) |
| `prisma/schema.prisma`  | DB 스키마 (`User` · `UserConsent` · `RefreshToken` · `Brand` · `Branch` · `Theme` · `ThemeLike` · `Source` · `CrawlRun`). 마이그레이션은 `prisma/migrations/` |
| `.env.example`          | 환경변수 예시 (커밋됨). `.env` 는 커밋하지 않는다                                                             |
| `nest-cli.json`         | Nest CLI 설정 (`nest g` 로 모듈·컨트롤러 생성 가능)                                                           |

| 스크립트 (`-w @escapers/backend`) | 설명                                          |
| --------------------------------- | --------------------------------------------- |
| `dev` / `worker:dev`              | API / 워커 개발 실행 (watch)                  |
| `build`                           | `dist/` 로 빌드 (`nest build`)                |
| `prisma:migrate`                  | `prisma migrate dev` (마이그레이션 생성·적용) |
| `prisma:generate`                 | Prisma Client 재생성                          |
| `start` / `start:worker`          | 빌드 결과로 API / 워커 실행                   |
| `crawl`                           | 테마 크롤러 수동 실행 (아래 "테마 크롤러")    |
| `crawl:slots`                     | 빈자리 크롤러 수동 실행 (아래 "빈자리 크롤러") |
| `lint` · `typecheck`              | ESLint(typescript-eslint) · 타입 검사         |

### 테마 크롤러

브랜드 사이트에서 지점 · 테마 메타데이터를 수집해 DB에 upsert 한다 (`src/crawl.ts`, 실행 전 `build` 를 자동으로 돌린다).
PostgreSQL 이 떠 있어야 하며, 소스(`Source`)가 없으면 첫 실행 때 브랜드와 함께 자동 등록된다.

```bash
npm run crawl -w @escapers/backend -- nextedition   # 넥스트에디션
npm run crawl -w @escapers/backend -- zeroworld     # 제로월드 (제로월드 다이브 포함)
npm run crawl -w @escapers/backend -- jigubyeol     # 지구별방탈출
npm run crawl -w @escapers/backend -- all           # 등록된 어댑터 전체
```

| 어댑터 키     | 브랜드                    | 사이트                                                           | 비고                                                          |
| ------------- | ------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------- |
| `nextedition` | 넥스트에디션              | [nextedition.co.kr](https://nextedition.co.kr)                   | 가격은 RSC 페이로드에서 추출                                  |
| `zeroworld`   | 제로월드 (다이브 포함)    | [zeroworldkorea.com](https://zeroworldkorea.com)                 | 테마는 예약 화면 POST 응답(조회 전용)에서 수집. 약 2분 소요   |
| `jigubyeol`   | 지구별방탈출              | [지구별방탈출.com](https://xn--2e0b040a4xj.com)                  | 사이트에 가격 정보가 없어 `priceFrom` 은 비어 있음            |

- 두 번째 인자로 실행 사유를 줄 수 있다 (`INITIAL` · `MANUAL`). 생략하면 최초 성공 전에는 `INITIAL`, 이후는 `MANUAL`.
- 결과는 `CrawlRun` 테이블에 기록된다 (`created` · `updated` · `unchanged` · `closed` · `invalid`).
  값이 바뀌지 않은 테마는 `lastSeenAt` 만 갱신해 `updatedAt` 이 실제 변경 시각으로 남는다.
- 검증 실패가 30% 를 넘으면 사이트 구조 변경으로 보고 저장하지 않는다. 일부만 실패하면 `PARTIAL` 로 기록하고 종료 테마 처리(`CLOSED`)는 건너뛴다.
- 새 브랜드 추가 절차 (상세는 [백엔드 명세서 §6.4 · §6.5](docs/백엔드명세서.md#64-구현된-어댑터)):
  1. `src/modules/crawler/adapters/` 에 `CrawlerAdapter` 를 구현하고 `adapter.registry.ts` 의 `ADAPTERS` 에 추가한다.
  2. 포스터 이미지 호스트를 `frontend/next.config.ts` 의 `images.remotePatterns` 에 추가한다 (없으면 이미지가 400).
  3. 위 어댑터 표를 갱신한다.

### 빈자리 크롤러

수집된 `OPEN` 테마의 예약 시간(슬롯)을 한국 시간 기준 오늘부터 N일치(기본 7일, 최대 14일) 읽어 `Slot` 에 저장한다
(`src/crawl-slots.ts`, 실행 전 `build` 를 자동으로 돌린다). 테마 상세의 "예약 가능 시간"이 이 데이터를 보여준다.
테마를 먼저 수집해야 한다. 자동 감시(BullMQ · 감시 등록 기반)는 이후 추가한다.

```bash
npm run crawl:slots -w @escapers/backend -- jigubyeol     # 지구별방탈출 (지점 · 날짜당 1요청, 약 1분)
npm run crawl:slots -w @escapers/backend -- zeroworld     # 제로월드 (테마 · 날짜당 1요청, 약 10분)
npm run crawl:slots -w @escapers/backend -- all 3         # 지원하는 어댑터 전체, 3일치
```

| 어댑터 키     | 빈자리 수집 | 비고                                                                     |
| ------------- | ----------- | ------------------------------------------------------------------------ |
| `zeroworld`   | ✓           | 예약 화면 POST `theme_time_list`(조회 전용)                              |
| `jigubyeol`   | ✓           | `/reservation?branch=&date=`. 예약 기간 밖 날짜는 슬롯 없음으로 처리      |
| `nextedition` | ✗           | 예약 시간을 robots.txt 금지 경로(`/api/`)로만 받아와 수집하지 않는다     |

- 결과는 `CrawlRun(kind = slots)` 에 기록된다 (`created` · `opened`(마감 → 가능) · `closed` · `unchanged` · `missing` · `invalid` · `unknownThemes`).
  빈자리가 새로 생긴 시간은 로그에 `빈자리가 생겼습니다: 테마 날짜 시간` 으로 찍힌다.
- 전에 있던 시간이 사이트에서 사라지면 마감(`available = false`)으로 바꾼다. 검증이 일부라도 실패하면(`PARTIAL`) 이 처리는 건너뛴다.
- `unknownThemes` 가 0 보다 크면 사이트에 새 테마가 생긴 것이므로 테마 크롤러를 다시 실행한다.

## Lint & 포맷

ESLint 는 코드 품질, Prettier 는 포맷을 담당한다. 역할이 겹치는 규칙은
`eslint-config-prettier` 로 꺼서 서로 충돌하지 않는다.

| 파일                         | 내용                                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `frontend/eslint.config.mjs` | flat config. `eslint-config-next` (core-web-vitals + typescript) 뒤에 `eslint-config-prettier/flat` 을 **마지막**에 배치  |
| `.prettierrc.json`           | 세미콜론 O · 더블쿼트 · `trailingComma: es5` · `printWidth: 80` · `tabWidth: 2` · `arrowParens: always` · `endOfLine: lf` |
| `.prettierignore`            | 빌드 산출물 · `node_modules/` · `next-env.d.ts` · 모든 마크다운(`*.md` — 문서 · `AGENTS.md` · `CLAUDE.md`) 제외         |

- 커밋 전 `npm run lint` + `npm run format:check` 를 통과시킨다.
- 포맷만 어긋난 경우 `npm run format` 으로 일괄 정리한다.
- `.vscode/settings.json` 이 저장 시 Prettier 포맷 + ESLint 자동수정을 건다. 필요한 확장(`esbenp.prettier-vscode`, `dbaeumer.vscode-eslint`)은 `.vscode/extensions.json` 에 추천 등록돼 있다.
- `frontend/AGENTS.md` · `frontend/CLAUDE.md` 는 `next dev` 가 매번 재생성하므로 Prettier 대상에서 제외한다.
- Prettier 설정(`.prettierrc.json` · `.prettierignore`)은 루트에 하나만 두고 모든 워크스페이스에 적용한다.
  ESLint 설정은 워크스페이스별로 둔다 (`.vscode/settings.json` 의 `eslint.workingDirectories`).

## 스타일

전역 스타일 토큰과 CSS Modules 를 함께 쓴다.

| 파일                        | 역할                                                    |
| --------------------------- | ------------------------------------------------------- |
| `src/styles/colors.css`     | 원시 색상 팔레트 (`--color-red-800` 등)                 |
| `src/styles/semantic.css`   | 의미 기반 토큰 · 전역 시맨틱 클래스 (`--color-text` 등) |
| `src/app/globals.css`       | 진입점. 위 두 파일을 import                             |
| `src/util/BindClassName.ts` | `bindClassNames` — CSS Module 클래스명 바인딩 헬퍼      |

### `bindClassNames`

```ts
import { bindClassNames } from "@/util/BindClassName";
import styles from "./Header.module.css";

const cx = bindClassNames(styles);

cx("root"); // styles.root
cx("root", isActive && "active"); // 조건부 (falsy 인자는 무시)
cx({ root: true, active: isOpen }); // 불리언 맵
cx("root", "global-class"); // 등록 안 된 키는 원본 문자열 그대로 통과 (전역 시맨틱 클래스용)
```

- 여러 모듈을 넘기면 병합한다: `bindClassNames(styles, extra)`. 병합 시 키가 겹치면 에러를 던진다.
- 결과 문자열은 공백 하나로 join 한다.

## 컴포넌트 생성

`scripts/createComponent.mjs` — 외부 의존성 없는 스캐폴더 (Node 내장 모듈만).
컴포넌트 폴더 하나에 `Xxx.tsx` · `Xxx.module.css` · `index.tsx` 3파일을 만들고,
템플릿은 `bindClassNames` 를 쓴다.

```bash
npm run createComponent -- Button                            # src/components/Button/
npm run createComponent -- Header Footer                     # 여러 개 한 번에
npm run createComponent -- LoginForm --app login --client    # src/app/login/_component/LoginForm/ + "use client"
npm run createComponent -- Sidebar --app "(main)/dashboard"  # 라우트 그룹·중첩 경로는 따옴표
```

| 옵션            | 설명                                         |
| --------------- | -------------------------------------------- |
| (기본)          | `src/components/<Name>/` 에 생성             |
| `--app <route>` | `src/app/<route>/_component/<Name>/` 에 생성 |
| `--client`      | 파일 상단에 `"use client"` 추가              |
| `--force`       | 이미 있으면 덮어쓴다                         |

- 컴포넌트 이름은 PascalCase 여야 한다. 라우트 폴더가 없으면 자동 생성된다.
- 인자 없이 실행하면 이름 입력 프롬프트가 뜬다 (이 경우 플래그는 못 준다). 프롬프트에 명령어를 통째로 붙여넣지 말 것.

## 환경 변수

- `.env.local` 에 정의한다.
  - `NEXT_PUBLIC_SITE_URL` — 서버에서 자체 Route Handler 를 절대 URL 로 호출할 때 사용 (예: `http://localhost:3000`)
- `.env.development` 에 팀 공통값이 커밋돼 있다.
  - `NEXT_PUBLIC_API_MOCKING` — `enabled` 일 때만 MSW 목킹. 파일에는 두지 않고 `npm run dev:front:mock` 이 주입한다.
  - `NEXT_PUBLIC_API_BASE_URL` — 실제 백엔드 주소 (예: `http://localhost:4000`). `.env.local` 또는
    `.env.development.local` 에 개인적으로 지정한다. 목킹 시엔 값과 무관하게 핸들러가 경로로 가로챈다.

## 커밋 컨벤션

모든 커밋 메시지는 다음 형식을 따른다.

```
[Prefix][Scope] 변경 내용 요약
```

예: `[Feature][FE] 테마 필터 페이지 추가`, `[Fix][BE] 슬롯 비교 시 중복 감지 수정`

### Prefix 목록

| Prefix       | 설명                                                                                      |
| ------------ | ----------------------------------------------------------------------------------------- |
| `[Add]`      | 파일 추가                                                                                 |
| `[chore]`    | 패키지 매니저 변경 및 의존성 모듈 추가                                                    |
| `[Feature]`  | 기능 추가                                                                                 |
| `[Fix]`      | 기능(버그) 수정                                                                           |
| `[Docs]`     | 문서 관련 모든 수정                                                                       |
| `[Refactor]` | 동작 변경 없는 코드 구조 개선                                                             |
| `[Lint]`     | 린트 관련 사항 (ESLint 규칙·설정 변경 등), 코드 포맷팅, 세미콜론, 들여쓰기 등 스타일 변경 |
| `[Test]`     | 테스트 코드 추가/수정                                                                     |
| `[Remove]`   | 파일/코드 삭제                                                                            |
| `[Rename]`   | 파일/폴더명 변경 또는 이동                                                                |
| `[Design]`   | UI, CSS 등 디자인 관련 변경                                                               |
| `[Hotfix]`   | 배포 후 긴급 수정                                                                         |

### Scope 목록

변경이 모노레포의 어느 영역에 속하는지 Prefix 뒤에 표시한다.

| Scope      | 대상                 | 설명                                                                                          |
| ---------- | -------------------- | --------------------------------------------------------------------------------------------- |
| `[FE]`     | `frontend/`          | Next.js 프론트엔드 (페이지, 컴포넌트, 스타일, MSW 목킹 등)                                    |
| `[BE]`     | `backend/`           | NestJS API 서버 · 워커 (크롤러, 작업 큐, DB 스키마·마이그레이션 등)                           |
| `[Shared]` | `shared/`            | 프론트·백엔드 공용 zod 스키마 · DTO 타입 · 에러 코드                                          |
| `[Root]`   | 루트 · 위 세 곳 외부 | 워크스페이스 설정(`package.json` · `tsconfig.base.json`), 공통 린트/포맷 설정, CI, `docs/` 등 |

- 커밋 하나에는 Scope 도 하나만 붙인다. 여러 영역을 건드리면 영역별로 커밋을 나눈다.
  (예: API 계약 변경 → `[Feature][Shared]` 스키마 수정 커밋 + `[Feature][BE]` 구현 커밋 + `[Feature][FE]` 연동 커밋)
- 하나의 변경이 도저히 나눠지지 않으면 주된 영역의 Scope 를 쓰고, 함께 바뀐 영역을 본문에 적는다.
- 모노레포 전환 이전 커밋에는 Scope 가 없다. 이 커밋들은 `docs` 를 빼면 모두 프론트엔드(`[FE]`) 작업이다.

### 작성 규칙

- 커밋 하나는 하나의 목적만 가진다. Prefix 하나로 설명이 안 되면 커밋을 나눈다.
- 요약은 간결한 한글로 작성한다.
- 변경 이유(왜 필요한지)가 명확하지 않은 변경은 커밋 본문에 이유를 덧붙인다.

## 브랜치 전략

`main`(배포) · `develop`(통합) 두 장수 브랜치를 두고, 모든 작업은 짧게 사는 토픽
브랜치에서 진행한 뒤 PR 로 `develop` 에 합친다. `develop` 이 안정되면 `main` 으로
올리고 태그를 찍어 배포한다.

```
feature/12-review-form ─┐
fix/15-login-redirect  ─┼─▶ develop ─(안정화)─▶ main ─(태그·배포)
docs/18-branch-guide   ─┘                         ▲
                          hotfix/21-crash ────────┘ (배포본 긴급 수정, develop 에도 반영)
```

### 브랜치 종류

| 브랜치       | 수명 | 분기 원본 | 병합 대상          | 설명                                                  |
| ------------ | ---- | --------- | ------------------ | ----------------------------------------------------- |
| `main`       | 영구 | —         | —                  | 배포 상태. 항상 빌드 가능. 직접 커밋 금지             |
| `develop`    | 영구 | `main`    | `main`             | 다음 배포에 포함될 변경의 통합 지점                   |
| `feature/*`  | 단기 | `develop` | `develop`          | 기능 추가                                             |
| `fix/*`      | 단기 | `develop` | `develop`          | 버그 수정 (배포 전)                                   |
| `refactor/*` | 단기 | `develop` | `develop`          | 동작 변경 없는 구조 개선                              |
| `docs/*`     | 단기 | `develop` | `develop`          | 문서만 수정                                           |
| `hotfix/*`   | 단기 | `main`    | `main` + `develop` | 배포 후 긴급 수정. 병합 후 `develop` 에도 반드시 반영 |

브랜치 접두어는 커밋 컨벤션 Prefix 를 소문자화해 맞춘다 (`[Feature]` → `feature/`,
`[Fix]` → `fix/` …). `[Add]` · `[Lint]` · `[chore]` 같은 잡성 변경은 별도 브랜치를
파지 말고 관련 `feature/*` · `docs/*` 에 함께 담는다.

### 네이밍 규칙

```
<타입>/<이슈번호>-<케밥-케이스-요약>
```

- 예: `feature/12-review-form`, `fix/15-login-redirect`, `hotfix/21-image-crash`
- 이슈번호가 없으면 생략할 수 있으나, 이슈를 먼저 만드는 것을 권장한다.
- 요약은 영어 케밥 케이스로 짧게 쓴다.

### 작업 흐름

1. `develop` 을 최신화하고 거기서 브랜치를 딴다.
   ```bash
   git switch develop && git pull
   git switch -c feature/12-review-form
   ```
2. 커밋 컨벤션(`[Prefix] 요약`)에 맞춰 작게 커밋한다.
3. 푸시하고 `develop` 으로 PR 을 연다. PR 제목도 커밋 컨벤션을 따른다.
4. CI 통과 + 리뷰 승인 1명 이상 → **Squash and merge**.
5. 병합된 토픽 브랜치는 삭제한다.
6. 배포 시점에 `develop` → `main` PR 을 열어 병합하고 `main` 에 버전 태그(`v0.1.0`)를 찍는다.

### PR 규칙

- 대상 브랜치는 원칙적으로 `develop` (핫픽스만 `main`).
- 최소 1명 리뷰 승인 후 병합한다.
- 토픽 브랜치 → `develop` 병합은 **Squash and merge** 로 통일한다. 잡커밋이
  히스토리에 남지 않고 로그가 PR 단위로 유지된다.
- `develop` → `main` 병합만 **Merge commit** 을 써서 배포 경계를 히스토리에 남긴다.
- PR 본문에 변경 이유와 관련 이슈(`Closes #12`)를 적는다.

### 브랜치 보호 (GitHub Settings)

`main` · `develop` 공통:

- 직접 push 금지 — PR 필수
- force push · 브랜치 삭제 금지
- 병합 전 상태 검사 통과 필수: `lint` · `typecheck` · `format:check` · `build`
- `main` 은 승인 1명 이상 필수, 리뷰 대화 해결 필수

### 핫픽스 흐름

1. `main` 에서 `hotfix/*` 를 분기한다.
2. 수정 → `main` 으로 PR(`[Hotfix]` 커밋) → 병합 → 태그(`v0.1.1`).
3. 같은 변경을 `develop` 에도 병합한다. 충돌이 없으면 별도 PR, 있으면 cherry-pick.

### 커밋 컨벤션과의 매핑

| 커밋 Prefix                                    | 브랜치 타입             |
| ---------------------------------------------- | ----------------------- |
| `[Feature]`                                    | `feature/*`             |
| `[Fix]`                                        | `fix/*`                 |
| `[Hotfix]`                                     | `hotfix/*`              |
| `[Refactor]`                                   | `refactor/*`            |
| `[Docs]`                                       | `docs/*`                |
| `[Add]` · `[Lint]` · `[chore]` · `[Design]` 등 | 관련 작업 브랜치에 포함 |

## 구조

`frontend/src/` 는 레이어별 디렉터리로 나뉘어 있다. 각 폴더의 역할은 다음과 같다.

```
src/
  app/                  App Router. 라우팅 + 페이지 (되도록 얇게 유지)
    (guest)/            비로그인 전용 라우트 그룹. 로그인 상태로 진입 시 `/` 로 redirect (URL 미노출)
      auth/login/        로그인 페이지 (`LoginForm`, `SocialLoginForm`, `LoginReasonToast` — 강제 로그아웃 사유 토스트)
      auth/signup/        가입 방식 선택 페이지 + `member/` · `owner/` 역할별 가입 페이지
    (protected)/        로그인 필수 라우트 그룹. 비로그인 진입 시 `/auth/login` 으로 redirect (URL 미노출)
      mypage/             마이페이지. `_component/`(AccountInfo, MypageSidebar) + `reservations/`(예약 내역, WIP)
    auth/logout/         로그아웃 처리 라우트 (`LogoutHandler`)
    themes/              모든 테마 페이지. `ThemeBrowser`(필터 · 정렬 · 무한 스크롤), `FilterPanel`
    <domain>/           도메인별 라우트 세그먼트 (후기 등 추가 예정)
      _component/        해당 라우트 전용 컴포넌트 (밑줄 = 라우팅에서 제외되는 폴더)
    _component/          홈 전용 컴포넌트 (`ThemeCarousel`)
    layout.tsx          루트 레이아웃. metadata, <html lang="ko">, globals.css, CoreProvider import
    page.tsx            홈 라우트 `/`. 테마 컬렉션(hot · horror · active) 캐러셀 3개를 렌더
    globals.css         전역 스타일 진입점. colors.css · semantic.css 를 import
  api/                  원격 호출 레이어
    ApiClient.ts         axios 인스턴스. ApiClient.interceptor.ts 에서 401 시 accessToken 자동 재발급
    ApiClient.error.ts · ApiErrorRes.ts · ApiRes.ts   공통 에러/응답 타입 파싱
    constant/             공용 요청 스키마(zod, `AccountField.schema.ts`) · 강제 로그아웃 사유 메시지(`Reason.ts`)
    domain/<도메인>/      도메인별 액션·쿼리·뮤테이션 + 요청·응답 타입 (auth · user · theme · reservation(WIP))
  hooks/                공용 커스텀 훅 (`useThemeLike` — 좋아요 성공 시 모든 테마 목록 캐시를 함께 갱신, 비로그인 안내 토스트)
  components/           도메인에 종속되지 않는 공용 컴포넌트 (Header · Footer · InputBox · SubmitButton · SignupForm · ThemeCard · ThemeCardSkeleton 등)
  provider/             전역 프로바이더. CoreProvider 가 아래를 조립
    MSWProvider.tsx       개발 환경 API 목킹(MSW) 기동
    QueryProvider.tsx     QueryClientProvider + Devtools + 공통 에러 toast
  mocks/                MSW 목킹 (handlers/ 도메인별 핸들러 + index.ts(전체 목록), state/ — accountStore.ts(가입 계정 반영) · themeLikeStore.ts(계정별 좋아요) · reviewHelpfulStore.ts(계정별 도움이 돼요) · token.ts, utils/ — response.ts(ok/fail 엔벨로프) · auth.ts(공통 인증 단계), browser.ts · server.ts · init.ts)
  constant/             공용 상수 (token/ 쿠키 옵션, environment/ 환경 변수 래퍼 등)
  styles/               전역 스타일 / 테마 토큰 (colors.css · semantic.css · fonts.ts)
  util/                 순수 헬퍼 함수 (BindClassName 등)
  proxy.ts              미들웨어. accessToken 만료 시 요청 단계에서 선제적으로 재발급
  instrumentation.ts    서버 사이드(RSC/Route Handler/Proxy) MSW 목킹 기동
```

도메인은 계속 추가된다. 특정 화면에서만 쓰는 코드는 그 라우트 폴더 안(`_component/` 등)에 두고,
여러 도메인이 공유하는 것만 `components/` · `api/` · `util/` 등 최상위 레이어로 올린다.

`frontend/` 파일:

```
scripts/createComponent.mjs  컴포넌트 스캐폴더 (무의존성, `npm run createComponent`)
scripts/devMock.mjs          MSW 목킹 개발 서버 실행 (`npm run dev:front:mock`)
next.config.ts          Next 설정. `@escapers/shared` 트랜스파일, 테마 포스터 이미지 허용 호스트(`images.remotePatterns`, 캐시 1일),
                        개발 환경에서 `msw` 를 serverExternalPackages 로 제외 (Turbopack 충돌 방지)
tsconfig.json           tsconfig.base.json 상속, `@/*` → `./src/*` 경로 별칭, bundler 해석
eslint.config.mjs       flat config. eslint-config-next core-web-vitals + typescript + eslint-config-prettier
.env.development        팀 공통 환경 변수 (커밋됨). `.env.local` 도 이 폴더에 둔다
AGENTS.md               `next dev` 가 생성/재삽입하는 에이전트 규칙 블록
CLAUDE.md               `@AGENTS.md` · `@../docs/publishing-guidelines.md` 참조
```

루트 파일:

```
package.json            npm workspaces 정의 + 위임 스크립트
tsconfig.base.json      워크스페이스 공통 컴파일러 옵션 (strict 등)
docker-compose.yml      로컬 PostgreSQL (`docker compose up -d`)
docs/요구사항명세서.md   기능 요구사항
docs/백엔드명세서.md     백엔드 기술 스택 · 모노레포 구조 · API 계약
docs/에러명세서/          도메인별 에러 응답 명세 (공통 · 로그인 · User)
docs/publishing-guidelines.md  퍼블리싱(마크업·스타일) 작업 시 아이콘·컬러 규칙
.prettierrc.json        Prettier 포맷 규칙 (전 워크스페이스 공통)
.prettierignore         Prettier 제외 경로
.vscode/                에디터 공유 설정 — settings.json(저장 시 포맷) · extensions.json(추천 확장)
CLAUDE.md               `@frontend/AGENTS.md` · `@docs/publishing-guidelines.md` 참조
.gitignore              `.env*` 전체 무시, `next-env.d.ts` · `*.tsbuildinfo` 포함
```

### 의존성

| 구분   | 패키지                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------ |
| 런타임 | `next` 16.3.3, `react` / `react-dom` 19.2.8                                                                |
| 데이터 | `@tanstack/react-query` v5 + `@tanstack/react-query-devtools`, `axios`(HTTP client)                        |
| 폼     | `react-hook-form` + `@hookform/resolvers`, `zod`(스키마 검증)                                              |
| UI     | `react-icons`(아이콘), `react-toastify`(토스트)                                                            |
| 개발   | `typescript` ~6.0, `eslint` 9 + `eslint-config-next`, `prettier` 3 + `eslint-config-prettier`, `msw`(API 목킹) |

## 데이터 계층

- 서버 상태는 `provider/QueryProvider.tsx` 의 `QueryClientProvider` 아래에서 TanStack Query 로 관리한다.
  기본 `staleTime` 60초, `queries.retry` 3회, `mutations.retry` 0회. mutation 에 개별
  `onError` 가 없으면 API 에러를 공통으로 toast 노출한다(`react-toastify`).
- 원격 호출은 `api/` 로 모은다.
  - `api/ApiClient.ts` — axios 인스턴스. `api/ApiClient.interceptor.ts` 에서 401 응답 시
    accessToken 자동 재발급 후 재시도한다. `api/ApiClient.error.ts` · `api/ApiErrorRes.ts` 가
    서버 에러 응답을 공통 포맷으로 파싱한다.
  - `api/domain/<도메인>/` — 도메인별 액션/쿼리/뮤테이션 및 요청·응답 타입
    (예: `domain/auth/Auth.action.ts`, `Auth.mutation.ts`, `Auth.session.ts`,
    `domain/user/User.query.ts`, `User.mutation.ts`(닉네임·이메일·비밀번호·마케팅동의 수정, 회원 탈퇴),
    `domain/theme/Theme.query.ts`(목록 · 컬렉션), `Theme.mutation.ts`(좋아요), `Theme.filter.ts`(장르 · 활동성 라벨, URL 쿼리 ↔ 필터 상태),
    `domain/reservation/Reservation.query.ts`(WIP)).
- 인증 토큰(accessToken/refreshToken)은 쿠키로 관리하며, `src/proxy.ts` 가 미들웨어로
  요청마다 accessToken 부재 + refreshToken 존재 시 선제적으로 재발급한다.
- `Auth.session.ts` 가 서버 컴포넌트용 세션 조회를 제공한다.
  - `getOptionalSession` — 헤더처럼 항상 렌더되는 컴포넌트용. 실패해도 비로그인으로 조용히 처리.
  - `verifySession` — `(protected)` 라우트용. 미로그인/정지/탈퇴 시 `/auth/login` 또는
    `/auth/logout` 으로 redirect.
- 서버에서 초기 데이터를 넘겨주는 dehydrate/HydrationBoundary 패턴은
  `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md` 참고.

## API 목킹 (MSW)

- `npm run dev:front:mock` 으로 띄우면 MSW 로 API 를 목킹한다. `scripts/devMock.mjs` 가
  `NEXT_PUBLIC_API_MOCKING=enabled` 를 주입해 `next dev` 를 실행하며, 이미 설정된 프로세스 환경변수는
  `.env*` 파일이 덮어쓰지 않으므로 개인 env 설정과 무관하게 항상 목킹으로 뜬다.
  브라우저 콘솔에 `[MSW] Mocking enabled.` 가 찍히면 정상.
- `src/mocks/handlers/` — 도메인별 핸들러. 새 핸들러는 `handlers/index.ts` 목록에만 추가하면
  `src/mocks/browser.ts`(클라이언트) · `src/mocks/server.ts`(서버)가 함께 쓴다. `src/mocks/init.ts` 가 브라우저 워커를 기동한다.
- 응답 엔벨로프는 `src/mocks/utils/response.ts`(`ok`/`fail`), 로그인 필수 핸들러의 인증은
  `src/mocks/utils/auth.ts`(`authenticate`/`findAccountFromRequest`)를 쓴다.
- 브라우저 목킹은 `provider/MSWProvider.tsx` 에서, 서버(RSC/Route Handler/Proxy) 목킹은
  `src/instrumentation.ts` 에서 켠다.
- 실제 백엔드에 붙이려면 `npm run dev:front` 로 띄운다 (`NEXT_PUBLIC_API_BASE_URL` 필요, "환경 변수" 참고).
- Turbopack 번들링과 `msw/node` 의 충돌을 피하기 위해 `next.config.ts` 가 개발 환경에서만
  `msw` 를 `serverExternalPackages` 로 뺀다.
