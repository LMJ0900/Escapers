import type { Metadata } from "next";

import { ReservationQuery } from "@/api/domain/reservation/Reservation.query";
import { bindClassNames } from "@/util/BindClassName";

import ReservationList from "./_component/ReservationList/ReservationList";
import styles from "./page.module.css";

const cx = bindClassNames(styles);

export const metadata: Metadata = {
  title: "예약 내역 · Escapers",
};

export default async function MypageReservationsPage() {
  const reservations = await ReservationQuery.getMyReservations();

  return (
    <>
      <div className={cx("heading")}>
        <span className={cx("eyebrow")}>My Page</span>
        <h1 className={cx("title")}>예약 내역</h1>
      </div>

      <ReservationList initialReservations={reservations} />
    </>
  );
}
