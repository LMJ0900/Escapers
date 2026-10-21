import type { ReactNode } from "react";

import { getOptionalSession } from "@/api/domain/auth/Auth.session";
import { bindClassNames } from "@/util/BindClassName";

import HeaderActions from "./_components/HeaderActions/HeaderActions";
import HeaderNav from "./_components/HeaderNav/HeaderNav";
import Logo from "./_components/Logo/Logo";
import SearchProvider from "./_components/SearchProvider/SearchProvider";
import SearchScreen from "./_components/SearchScreen/SearchScreen";
import styles from "./Header.module.css";

const cx = bindClassNames(styles);

type HeaderProps = {
  children?: ReactNode;
};

export default async function Header({ children }: HeaderProps) {
  const initialMe = await getOptionalSession();

  return (
    <SearchProvider>
      <header className={cx("root")}>
        <Logo />
        <HeaderNav />
        <HeaderActions initialMe={initialMe} />
      </header>

      <SearchScreen>{children}</SearchScreen>
    </SearchProvider>
  );
}
