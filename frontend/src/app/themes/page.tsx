import type { Metadata } from "next";

import { parseThemeSearchParams } from "@/api/domain/theme/Theme.filter";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import { bindClassNames } from "@/util/BindClassName";

import ThemeBrowser from "./_component/ThemeBrowser/ThemeBrowser";
import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "모든 테마 · Escapers",
};

const PAGE_SIZE = 20;

type ThemesPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ThemesPage({ searchParams }: ThemesPageProps) {
  const filters = parseThemeSearchParams(await searchParams);
  const initialPage = await ThemeQuery.getThemes({
    ...filters,
    size: PAGE_SIZE,
  });

  return (
    <div className={cx("page")}>
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>Themes</span>
        <h1 className={cx("title")}>모든 테마</h1>
        <span className={cx("count")}>
          총 {initialPage.totalCount}개의 테마
        </span>
      </div>

      <ThemeBrowser
        initialFilters={filters}
        initialPage={initialPage}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
