/**
 * 값 → 표시 라벨 사전으로 enum 을 정의한다. 키 선언 순서가 곧 표시·정렬 순서다.
 *
 * @example
 * const COLOR = defineLabeledEnum({ RED: "빨강", BLUE: "파랑" });
 * type Color = (typeof COLOR.values)[number]; // "RED" | "BLUE"
 * COLOR.label("RED"); // "빨강"
 * COLOR.is("GREEN"); // false
 */
export function defineLabeledEnum<const T extends Record<string, string>>(
  labels: T
) {
  type Value = keyof T & string;
  const values = Object.keys(labels) as Value[];

  return {
    /** 선언 순서대로의 값 목록 */
    values,
    labels,
    label: (value: Value): T[Value] => labels[value],
    /** URL 파라미터 등 외부 문자열이 이 enum 의 값인지 검사한다. */
    is: (value: string): value is Value => (values as string[]).includes(value),
  };
}
