import { verifySession } from "@/api/domain/auth/Auth.session";
import { bindClassNames } from "@/util/BindClassName";

import MypageSidebar from "./_component/MypageSidebar/MypageSidebar";
import styles from "./layout.module.css";

const cx = bindClassNames(styles);

export default async function MypageLayout({
  children,
}: LayoutProps<"/mypage">) {
  const me = await verifySession();

  return (
    <div className={cx("root")}>
      <aside className={cx("sidebar")}>
        <MypageSidebar initialMe={me} />
      </aside>
      <main className={cx("content")}>{children}</main>
    </div>
  );
}
