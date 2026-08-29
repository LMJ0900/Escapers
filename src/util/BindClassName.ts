type Styles = Record<string, string>;

export const bindClassNames = <T extends Styles>(...styleModules: T[]) => {
  const styles = Object.assign({}, ...styleModules) as T;

  // 실제로 병합 충돌을 검사 (단일 모듈이면 항상 통과)
  const declaredKeys = styleModules.reduce(
    (n, m) => n + Object.keys(m).length,
    0
  );
  if (Object.keys(styles).length !== declaredKeys) {
    throw new Error(
      "Detected duplicate keys while merging styles. Ensure unique class names."
    );
  }

  type BoolMap = Partial<Record<keyof T, boolean>>;
  type Arg = keyof T | (string & {}) | false | null | undefined | BoolMap;

  return (...args: Arg[]): string => {
    const out: string[] = [];
    for (const arg of args) {
      if (!arg) continue;
      if (typeof arg === "object") {
        for (const [key, active] of Object.entries(arg)) {
          if (active) out.push(styles[key] ?? key); // ← 미등록 키는 원본 유지
        }
      } else {
        out.push(styles[arg as string] ?? String(arg));
      }
    }
    return out.join(" "); // 빈 세그먼트가 없어 이중 공백도 없음
  };
};
