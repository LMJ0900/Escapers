import type { ReactNode } from "react";

import { getOptionalSession } from "@/api/domain/auth/Auth.session";
import { bindClassNames } from "@/util/BindClassName";

import HeaderActions from "./_components/HeaderActions/HeaderActions";
import HeaderNav from "./_components/HeaderNav/HeaderNav";
import Logo from "./_components/Logo/Logo";
import styles from "./Header.module.css";

const cx = bindClassNames(styles);

type HeaderProps = {
  children?: ReactNode;
};

export default async function Header({ children }: HeaderProps) {
  const initialMe = await getOptionalSession();

  return (
    <>
      <header className={cx("root")}>
        <Logo />
        <HeaderNav />
        <HeaderActions initialMe={initialMe} />
      </header>

      {children}
    </>
  );
}
