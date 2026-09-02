import type { InputHTMLAttributes, Ref } from "react";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./InputBox.module.css";

const cx = bindClassNames(styles);

type InputBoxProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 입력창 위에 노출되는 라벨 텍스트 */
  label: string;
  /** 에러 메시지. 값이 있으면 에러 스타일 + 메시지를 렌더한다. */
  error?: string;
  /** react-hook-form register 의 ref 등을 전달받기 위한 프로퍼티 (React 19 ref-as-prop) */
  ref?: Ref<HTMLInputElement>;
};

export default function InputBox({
  id,
  label,
  error,
  className,
  ref,
  ...rest
}: InputBoxProps) {
  const errorId = error && id ? `${id}-error` : undefined;

  return (
    <div className={cx("root")}>
      <label className={cx("label")} htmlFor={id}>
        {label}
      </label>

      <input
        id={id}
        ref={ref}
        className={cx("input", { inputError: Boolean(error) }, className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={errorId}
        {...rest}
      />

      {error ? (
        <p id={errorId} className={cx("error")} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
