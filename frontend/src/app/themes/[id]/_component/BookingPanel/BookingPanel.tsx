"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { FiArrowRight } from "react-icons/fi";

import { formatSlotDate } from "@/api/domain/theme/Theme.detail";
import { ThemeQuery } from "@/api/domain/theme/Theme.query";
import type { ThemeSlotDay } from "@/api/domain/theme/Theme.type";
import type { getThemeSlotsResponse } from "@/api/domain/theme/getThemeSlots/response/getThemeSlotsRes";
import { bindClassNames } from "@/util/BindClassName";

import styles from "./BookingPanel.module.css";

const cx = bindClassNames(styles);

type BookingPanelProps = {
  themeId: string;
  priceFrom: number | null;
  /** 지점의 외부 예약 페이지. 예약 대행은 범위 밖이라 이 링크로 이동시킨다. */
  bookingUrl: string | null;
  initialSlots: getThemeSlotsResponse;
};

function findFirstAvailableTime(day: ThemeSlotDay | undefined): string | null {
  return day?.slots.find((slot) => slot.available)?.time ?? null;
}

/** 가격 확인 및 예약. 날짜/시간별 예약 가능 여부를 보여주고 지점 예약 페이지로 보낸다. */
export default function BookingPanel({
  themeId,
  priceFrom,
  bookingUrl,
  initialSlots,
}: BookingPanelProps) {
  const { data } = useQuery({
    queryKey: ThemeQuery.getThemeSlotsQueryKey(themeId),
    queryFn: () => ThemeQuery.getThemeSlots(themeId),
    initialData: initialSlots,
  });
  const days = data.days;

  // 예약 가능한 시간이 있는 가장 빠른 날짜와 그 날의 첫 빈 시간을 처음 선택값으로 쓴다.
  const [selectedDate, setSelectedDate] = useState<string | undefined>(
    () => (days.find((day) => findFirstAvailableTime(day)) ?? days[0])?.date
  );
  const selectedDay = days.find((day) => day.date === selectedDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(() =>
    findFirstAvailableTime(
      days.find((day) => findFirstAvailableTime(day)) ?? days[0]
    )
  );

  const handleSelectDate = (day: ThemeSlotDay) => {
    setSelectedDate(day.date);
    setSelectedTime(findFirstAvailableTime(day));
  };

  return (
    <section id="booking" className={cx("root")}>
      <h2 className={cx("title")}>가격 확인 및 예약</h2>

      <div className={cx("panel")}>
        <div className={cx("price")}>
          <span className={cx("label")}>1인 기준</span>
          {priceFrom === null ? (
            <span className={cx("priceValue")}>가격 문의</span>
          ) : (
            <span className={cx("priceValue")}>
              {priceFrom.toLocaleString("ko-KR")}원
              <span className={cx("priceTilde")}> ~</span>
            </span>
          )}
        </div>

        {days.length === 0 ? (
          <p className={cx("empty")}>확인할 수 있는 예약 일정이 없어요.</p>
        ) : (
          <>
            <hr className={cx("divider")} />

            <div className={cx("group")}>
              <span className={cx("label")}>날짜</span>
              <div className={cx("days")}>
                {days.map((day) => {
                  const { label, weekday } = formatSlotDate(day.date);
                  return (
                    <button
                      key={day.date}
                      type="button"
                      className={cx("chip", {
                        chipOn: day.date === selectedDate,
                      })}
                      aria-pressed={day.date === selectedDate}
                      onClick={() => handleSelectDate(day)}
                    >
                      <span>{label}</span>
                      <span>{weekday}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={cx("group")}>
              <span className={cx("label")}>시간</span>
              <div className={cx("slots")}>
                {selectedDay?.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    className={cx("chip", {
                      chipOn: slot.time === selectedTime,
                      chipSoldOut: !slot.available,
                    })}
                    aria-pressed={slot.time === selectedTime}
                    disabled={!slot.available}
                    onClick={() => setSelectedTime(slot.time)}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {bookingUrl ? (
          <a
            href={bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cx("cta")}
          >
            예약하기
            <FiArrowRight aria-hidden />
          </a>
        ) : (
          <button type="button" className={cx("cta")} disabled>
            예약 링크 준비 중
          </button>
        )}
      </div>
    </section>
  );
}
