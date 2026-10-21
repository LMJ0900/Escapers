import { bindClassNames } from "@/util/BindClassName";

import styles from "./MobileBookingBar.module.css";

const cx = bindClassNames(styles);

type MobileBookingBarProps = {
  priceFrom: number | null;
  bookingUrl: string | null;
};

/** 모바일에서만 보이는 하단 고정 바. 페이지 끝에서는 푸터 위에 멈춘다. */
export default function MobileBookingBar({
  priceFrom,
  bookingUrl,
}: MobileBookingBarProps) {
  if (!bookingUrl) return null;

  return (
    <div className={cx("root")}>
      <div className={cx("price")}>
        <span className={cx("label")}>1인 기준</span>
        <span className={cx("priceValue")}>
          {priceFrom === null ? (
            "가격 문의"
          ) : (
            <>
              {priceFrom.toLocaleString("ko-KR")}원
              <span className={cx("priceTilde")}> ~</span>
            </>
          )}
        </span>
      </div>
      <a
        href={bookingUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={cx("cta")}
      >
        예약하기
      </a>
    </div>
  );
}
