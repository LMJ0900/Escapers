# 퍼블리싱 지침

UI 마크업/스타일 작업(퍼블리싱) 시 아래 규칙을 따른다.

## 아이콘

- 아이콘은 항상 [`react-icons`](https://react-icons.github.io/react-icons/)에서 가져와 사용한다. (이미 의존성에 포함됨)
- 알맞은 아이콘이 없을 경우 임의로 SVG를 인라인하거나 다른 아이콘 라이브러리를 추가하지 말고,
  **다른 방법(직접 SVG 추가, 다른 라이브러리 도입 등)에 대해 사용자에게 먼저 허용을 구한다.**

## 컬러 (CSS)

색상은 아래 우선순위를 따른다.

1. **`src/styles/semantic.css`의 의미 토큰을 최우선으로 사용한다.**
   예: `var(--color-bg)`, `var(--color-brand)`, `var(--color-text-muted)`, `var(--color-border)` 등
2. semantic.css에 알맞은 토큰이 없으면 **`src/styles/colors.css`의 원시 팔레트 토큰을 사용한다.**
   예: `var(--color-orange-500)`, `var(--color-stone-200)` 등
3. colors.css에도 알맞은 색이 없으면 → **colors.css에 새 색을 추가해도 되는지 사용자에게 묻는다.**
4. 여러 곳에서 반복적으로 쓰일 것 같은 색이면 → **semantic.css에 의미 토큰으로 추가해도 되는지 사용자에게 묻는다.**

- 컴포넌트/모듈 CSS에 HEX·rgb·hsl 리터럴을 직접 하드코딩하지 않는다. 항상 위 토큰을 `var()`로 참조한다.
