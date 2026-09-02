import type { ReactNode } from "react";

import { bindClassNames } from "@/util/BindClassName";

import HeaderActions from "./_components/HeaderActions/HeaderActions";
import HeaderNav from "./_components/HeaderNav/HeaderNav";
import Logo from "./_components/Logo/Logo";
import styles from "./Header.module.css";

const cx = bindClassNames(styles);

type HeaderProps = {
  children?: ReactNode;
};

export default function Header({ children }: HeaderProps) {
  return (
    <>
      <header className={cx("root")}>
        <Logo />
        <HeaderNav />
        <HeaderActions />
      </header>

      {children}
    </>
  );
}
