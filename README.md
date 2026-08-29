# Escapers — 방탈출 리뷰 사이트

Next.js 16 (App Router) · React 19 · TanStack Query v5 · TypeScript · CSS (전역 CSS + CSS Modules)

## 개발

```bash
npm run dev
```

http://localhost:3000

| 스크립트                  | 설명                                                    |
| ------------------------- | ------------------------------------------------------- |
| `npm run dev`             | 개발 서버                                               |
| `npm run build`           | 프로덕션 빌드                                           |
| `npm run start`           | 빌드 결과 실행                                          |
| `npm run lint`            | ESLint                                                  |
| `npm run typecheck`       | `tsc --noEmit` 타입 검사                                |
| `npm run format`          | Prettier 로 전체 포맷팅                                 |
| `npm run format:check`    | 포맷 위반만 검사 (CI 용)                                |
| `npm run createComponent` | 컴포넌트 폴더 스캐폴드 생성 (아래 "컴포넌트 생성" 참고) |

## Lint & 포맷

ESLint 는 코드 품질, Prettier 는 포맷을 담당한다. 역할이 겹치는 규칙은
`eslint-config-prettier` 로 꺼서 서로 충돌하지 않는다.

| 파일                | 내용                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `eslint.config.mjs` | flat config. `eslint-config-next` (core-web-vitals + typescript) 뒤에 `eslint-config-prettier/flat` 을 **마지막**에 배치  |
| `.prettierrc.json`  | 세미콜론 O · 더블쿼트 · `trailingComma: es5` · `printWidth: 80` · `tabWidth: 2` · `arrowParens: always` · `endOfLine: lf` |
| `.prettierignore`   | 빌드 산출물 · `node_modules/` · `AGENTS.md` · `CLAUDE.md` · `next-env.d.ts` 제외                                          |

- 커밋 전 `npm run lint` + `npm run format:check` 를 통과시킨다.
- 포맷만 어긋난 경우 `npm run format` 으로 일괄 정리한다.
- `.vscode/settings.json` 이 저장 시 Prettier 포맷 + ESLint 자동수정을 건다. 필요한 확장(`esbenp.prettier-vscode`, `dbaeumer.vscode-eslint`)은 `.vscode/extensions.json` 에 추천 등록돼 있다.
- `AGENTS.md` · `CLAUDE.md` 는 `next dev` 가 매번 재생성하므로 Prettier 대상에서 제외한다.

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

`.env.local` 에 정의한다.

- `NEXT_PUBLIC_SITE_URL` — 서버에서 자체 Route Handler 를 절대 URL 로 호출할 때 사용 (예: `http://localhost:3000`)

## 커밋 컨벤션

모든 커밋 메시지는 다음 형식을 따른다.

```
[Prefix] 변경 내용 요약
```

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

레이어별 디렉터리 스캐폴드를 잡아 둔 상태다. 아래 표시한 `.tsx` 파일 3개 외에는 아직 빈 폴더이며, 각 폴더의 역할은 다음과 같다.

```
src/
  app/                  App Router. 라우팅 + 페이지 (되도록 얇게 유지)
    (main)/             랜딩 페이지 라우트 그룹. 랜딩 화면과 그 전용 컴포넌트를 함께 둠 (URL 미노출)
    <domain>/           도메인별 라우트 세그먼트 (인증 · 테마 · 후기 등 추가 예정)
      _component/        해당 라우트 전용 컴포넌트 (밑줄 = 라우팅에서 제외되는 폴더)
    layout.tsx          루트 레이아웃. metadata, <html lang="ko">, globals.css import
    page.tsx            홈 라우트 `/`. 현재는 자리표시자만 렌더
    globals.css         전역 스타일 진입점. colors.css · semantic.css 를 import
  api/                  원격 호출 레이어. fetch 래퍼 + 엔드포인트별 함수
  hooks/                공용 커스텀 훅 (쿼리 · 뮤테이션 훅, UI 훅 등)
  components/           도메인에 종속되지 않는 공용 컴포넌트
  provider/             전역 프로바이더 (QueryClientProvider + Devtools 등)
  constant/             공용 상수 (라우트 경로, 쿼리 키, 옵션 목록 등)
  styles/               전역 스타일 / 테마 토큰 (colors.css · semantic.css)
  util/                 순수 헬퍼 함수 (BindClassName 등)
```

도메인은 계속 추가된다. 특정 화면에서만 쓰는 코드는 그 라우트 폴더 안(`_component/` 등)에 두고,
여러 도메인이 공유하는 것만 `components/` · `api/` · `util/` 등 최상위 레이어로 올린다.

루트 파일:

```
docs/요구사항명세서.md   기능 요구사항 (git 에 커밋된 유일한 문서)
scripts/createComponent.mjs  컴포넌트 스캐폴더 (무의존성, `npm run createComponent`)
next.config.ts          Next 설정 (현재 비어 있음, 기본값)
tsconfig.json           strict 모드, `@/*` → `./src/*` 경로 별칭, bundler 해석
eslint.config.mjs       flat config. eslint-config-next core-web-vitals + typescript + eslint-config-prettier
.prettierrc.json        Prettier 포맷 규칙
.prettierignore         Prettier 제외 경로
.vscode/                에디터 공유 설정 — settings.json(저장 시 포맷) · extensions.json(추천 확장)
AGENTS.md               `next dev` 가 생성/재삽입하는 에이전트 규칙 블록
CLAUDE.md               `@AGENTS.md` 참조 한 줄
.gitignore              `.env*` 전체 무시, `next-env.d.ts` · `*.tsbuildinfo` 포함
```

### 의존성

| 구분   | 패키지                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ |
| 런타임 | `next` 16.3.3, `react` / `react-dom` 19.2.8                                                |
| 데이터 | `@tanstack/react-query` v5 + `@tanstack/react-query-devtools` (설치만, 코드 연결 전)       |
| 개발   | `typescript` 5, `eslint` 9 + `eslint-config-next`, `prettier` 3 + `eslint-config-prettier` |

## 데이터 계층 (예정)

- 서버 상태는 `provider/` 의 QueryClientProvider 아래에서 TanStack Query 로 관리한다.
- 원격 호출은 `api/` 의 함수로 모으고, 컴포넌트는 `hooks/` 의 쿼리·뮤테이션 훅만 사용한다.
- 서버에서 초기 데이터를 넘겨주는 dehydrate/HydrationBoundary 패턴은
  `node_modules/next/dist/docs/01-app/02-guides/client-side-data-fetching/tanstack-query.md` 참고.
