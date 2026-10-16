import { bindClassNames } from "@/util/BindClassName";

import styles from "./DifficultyMeter.module.css";

const cx = bindClassNames(styles);

const MAX_DIFFICULTY = 5;

type DifficultyMeterProps = {
  difficulty: number | null;
};

export default function DifficultyMeter({ difficulty }: DifficultyMeterProps) {
  return (
    <span
      className={cx("diffWrap")}
      aria-label={
        difficulty === null
          ? "난이도 정보 없음"
          : `난이도 ${difficulty} / ${MAX_DIFFICULTY}`
      }
    >
      <span className={cx("diffLabel")}>난이도</span>
      {difficulty === null ? (
        <span className={cx("diff", "diffUnknown")}>–</span>
      ) : (
        <span className={cx("diff")}>
          <span className={cx("diffOn")}>{"●".repeat(difficulty)}</span>
          {"○".repeat(MAX_DIFFICULTY - difficulty)}
        </span>
      )}
    </span>
  );
}
