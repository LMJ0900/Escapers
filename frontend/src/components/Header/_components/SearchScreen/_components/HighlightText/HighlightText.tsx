import { bindClassNames } from "@/util/BindClassName";

import styles from "./HighlightText.module.css";

const cx = bindClassNames(styles);

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

type HighlightTextProps = {
  text: string;
  /** 강조할 검색어 단어들. 대소문자는 구분하지 않는다. */
  terms: string[];
};

/** 검색어와 일치한 글자를 `<mark>`로 감싸 보여준다. */
export default function HighlightText({ text, terms }: HighlightTextProps) {
  const pattern = [...terms]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)
    .map(escapeRegExp)
    .join("|");

  if (!pattern) return <>{text}</>;

  // 캡처 그룹으로 나누면 일치한 조각이 홀수 번째에 들어온다.
  const parts = text.split(new RegExp(`(${pattern})`, "gi"));

  return (
    <>
      {parts.map((part, index) =>
        index % 2 === 1 ? (
          <mark key={index} className={cx("mark")}>
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
