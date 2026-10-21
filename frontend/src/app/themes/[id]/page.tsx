import { THEME_GENRE } from "@escapers/shared";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { FiChevronRight } from "react-icons/fi";

import { isApiErrorResponse } from "@/api/ApiErrorRes";
import { REVIEW_PAGE_SIZE } from "@/api/domain/theme/Theme.detail";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import { bindClassNames } from "@/util/BindClassName";

import ActivityNotice from "./_component/ActivityNotice/ActivityNotice";
import BookingPanel from "./_component/BookingPanel/BookingPanel";
import LocationMap from "./_component/LocationMap/LocationMap";
import MobileBookingBar from "./_component/MobileBookingBar/MobileBookingBar";
import SectionTabs from "./_component/SectionTabs/SectionTabs";
import ThemeFacts from "./_component/ThemeFacts/ThemeFacts";
import ThemeIntro from "./_component/ThemeIntro/ThemeIntro";
import ThemePhoto from "./_component/ThemePhoto/ThemePhoto";
import ThemeReviews from "./_component/ThemeReviews/ThemeReviews";
import ThemeTitleBlock from "./_component/ThemeTitleBlock/ThemeTitleBlock";
import styles from "./page.module.css";

const cx = bindClassNames(styles);

/** 같은 요청 안에서 메타데이터와 페이지가 테마 상세를 두 번 받지 않도록 묶는다. */
const getThemeDetail = cache(async (themeId: string) => {
  try {
    return await ThemeQuery.getThemeDetail(themeId);
  } catch (error) {
    if (isApiErrorResponse(error) && error.status === 404) notFound();
    throw error;
  }
});

export async function generateMetadata({
  params,
}: PageProps<"/themes/[id]">): Promise<Metadata> {
  const { id } = await params;
  const theme = await getThemeDetail(id);

  return {
    title: `${theme.name} · Escapers`,
    description:
      theme.description?.split(/\n{2,}/)[0] ??
      `${theme.brandName} ${theme.branchName}의 ${THEME_GENRE.label(theme.genre)} 테마`,
  };
}

export default async function ThemeDetailPage({
  params,
}: PageProps<"/themes/[id]">) {
  const { id } = await params;
  const theme = await getThemeDetail(id);
  const [slots, reviews] = await Promise.all([
    ThemeQuery.getThemeSlots(id),
    ThemeQuery.getThemeReviews({
      themeId: id,
      sort: "HELPFUL",
      size: REVIEW_PAGE_SIZE,
    }),
  ]);

  return (
    <div className={cx("page")}>
      <div className={cx("heading")}>
        <nav className={cx("breadcrumb")} aria-label="현재 위치">
          <Link href="/themes" className={cx("breadcrumbLink")}>
            테마
          </Link>
          <FiChevronRight aria-hidden />
          <span aria-current="page" className={cx("breadcrumbCurrent")}>
            {theme.name}
          </span>
        </nav>
        <ThemeTitleBlock theme={theme} />
      </div>

      <div className={cx("photo")}>
        <ThemePhoto name={theme.name} imageUrl={theme.imageUrl} />
      </div>

      <div className={cx("body")}>
        <div>
          <SectionTabs reviewCount={theme.reviewCount} />
          <ThemeFacts theme={theme} />
          {theme.activityLevel && (
            <ActivityNotice activityLevel={theme.activityLevel} />
          )}
        </div>

        <BookingPanel
          themeId={theme.id}
          priceFrom={theme.priceFrom}
          bookingUrl={theme.branch.bookingUrl}
          initialSlots={slots}
        />
        <ThemeIntro description={theme.description} />
        <LocationMap branch={theme.branch} />
        <ThemeReviews themeId={theme.id} initialPage={reviews} />
      </div>

      <MobileBookingBar
        priceFrom={theme.priceFrom}
        bookingUrl={theme.branch.bookingUrl}
      />
    </div>
  );
}
