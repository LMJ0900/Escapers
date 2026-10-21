import { bindClassNames } from "@/util/BindClassName";

import styles from "./ThemeIntro.module.css";

const cx = bindClassNames(styles);

type ThemeIntroProps = {
  description: string | null;
};

/** 테마 소개. 빈 줄(\n\n)로 구분된 문단을 각각 한 문단으로 그린다. */
export default function ThemeIntro({ description }: ThemeIntroProps) {
  const paragraphs = description
    ?.split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return (
    <section id="intro" className={cx("root")}>
      <h2 className={cx("title")}>테마 소개</h2>
      {paragraphs && paragraphs.length > 0 ? (
        paragraphs.map((paragraph) => (
          <p key={paragraph} className={cx("paragraph")}>
            {paragraph}
          </p>
        ))
      ) : (
        <p className={cx("empty")}>아직 등록된 소개가 없어요.</p>
      )}
    </section>
  );
}
