"use client";

import { useQuery } from "@tanstack/react-query";

import { ReservationQuery } from "@/api/domain/reservation/Reservation.query";
import type { getMyReservationsResponse } from "@/api/domain/reservation/getMyReservations/response/getMyReservationsRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./ReservationList.module.css";

const cx = bindClassNames(styles);

type ReservationListProps = {
  initialReservations: getMyReservationsResponse;
};

function formatScheduledAt(iso: string): string {
  const date = new Date(iso);
  const datePart = new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
  const timePart = new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return `${datePart} ${timePart}`;
}

export default function ReservationList({
  initialReservations,
}: ReservationListProps) {
  const { data: reservations } = useQuery({
    queryKey: ReservationQuery.getMyReservationsQueryKey,
    queryFn: () => ReservationQuery.getMyReservations(),
    initialData: initialReservations,
  });

  const upcoming = [...reservations]
    .filter((r) => r.status === "CONFIRMED")
    .sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
    );
  const past = [...reservations]
    .filter((r) => r.status === "COMPLETED")
    .sort(
      (a, b) =>
        new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
    );

  return (
    <div className={cx("wrapper")}>
      <section className={cx("section")}>
        <p className={cx("sectionTitle")}>다가오는 예약</p>
        {upcoming.length === 0 ? (
          <p className={cx("empty")}>다가오는 예약이 없어요.</p>
        ) : (
          <div className={cx("list")}>
            {upcoming.map((reservation) => (
              <div key={reservation.id} className={cx("card")}>
                <div className={cx("thumb")} aria-hidden />
                <div className={cx("info")}>
                  <span className={cx("themeName")}>
                    {reservation.themeName}
                  </span>
                  <span className={cx("meta")}>
                    {reservation.branchName} ·{" "}
                    {formatScheduledAt(reservation.scheduledAt)} ·{" "}
                    {reservation.headcount}인
                  </span>
                </div>
                <span className={cx("badgeConfirmed")}>확정</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={cx("section")}>
        <p className={cx("sectionTitle")}>지난 예약</p>
        {past.length === 0 ? (
          <p className={cx("empty")}>지난 예약이 없어요.</p>
        ) : (
          <div className={cx("list")}>
            {past.map((reservation) => (
              <div key={reservation.id} className={cx("card", "cardMuted")}>
                <div className={cx("thumb")} aria-hidden />
                <div className={cx("info")}>
                  <span className={cx("themeNameMuted")}>
                    {reservation.themeName}
                  </span>
                  <span className={cx("metaMuted")}>
                    {reservation.branchName} ·{" "}
                    {formatScheduledAt(reservation.scheduledAt)} ·{" "}
                    {reservation.headcount}인
                  </span>
                </div>
                <span className={cx("badgeDone")}>이용완료</span>
                {!reservation.hasReview && (
                  // TODO: 리뷰 작성 라우트가 정해지면 버튼을 Link로 교체
                  <button type="button" className={cx("btnSm")}>
                    리뷰 쓰기
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
