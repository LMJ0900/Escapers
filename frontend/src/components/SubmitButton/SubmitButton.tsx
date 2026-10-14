import type { ButtonHTMLAttributes, ReactNode } from "react";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./SubmitButton.module.css";

const cx = bindClassNames(styles);

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
};

export default function SubmitButton({
  children,
  className,
  ...rest
}: SubmitButtonProps) {
  return (
    <button type="submit" className={cx("root", className)} {...rest}>
      {children}
    </button>
  );
}
