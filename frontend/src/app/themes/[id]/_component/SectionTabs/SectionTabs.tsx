"use client";

import { useEffect, useState } from "react";

import { bindClassNames } from "@/util/BindClassName";

import styles from "./SectionTabs.module.css";

const cx = bindClassNames(styles);

/** 현재 섹션으로 보는 기준선. 뷰포트 위에서 이 비율만큼 내려온 위치를 지난 섹션 중 마지막이 현재 섹션이다. */
const ACTIVE_LINE_RATIO = 0.3;

type SectionTabsProps = {
  reviewCount: number;
};

/** 소개 / 위치 / 후기 섹션으로 이동하는 앵커 탭. 스크롤 위치에 맞춰 현재 섹션을 강조한다. */
export default function SectionTabs({ reviewCount }: SectionTabsProps) {
  const tabs = [
    { id: "intro", label: "소개" },
    { id: "location", label: "위치" },
    { id: "reviews", label: `후기 ${reviewCount}` },
  ];
  const [activeId, setActiveId] = useState(tabs[0].id);

  useEffect(() => {
    const ids = ["intro", "location", "reviews"];
    let frame = 0;

    const update = () => {
      frame = 0;
      const line = window.innerHeight * ACTIVE_LINE_RATIO;
      let current = ids[0];
      for (const id of ids) {
        const section = document.getElementById(id);
        if (section && section.getBoundingClientRect().top <= line) {
          current = id;
        }
      }
      setActiveId(current);
    };
    const schedule = () => {
      if (frame === 0) frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    // 새로고침으로 스크롤 위치가 복원됐거나 해시로 들어온 경우를 위해 한 번 맞춰 둔다.
    schedule();

    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame !== 0) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <nav className={cx("root")} aria-label="상세 섹션">
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={`#${tab.id}`}
          className={cx("tab", { tabOn: tab.id === activeId })}
          aria-current={tab.id === activeId ? "true" : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
