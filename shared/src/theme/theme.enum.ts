import { defineLabeledEnum } from "../enum/defineLabeledEnum";

export const THEME_GENRE = defineLabeledEnum({
  HORROR: "공포",
  IMMERSIVE: "이머시브",
  MYSTERY: "추리",
  SF: "SF",
  COMEDY: "코미디",
  THRILLER: "스릴러",
  FANTASY: "판타지",
  ADVENTURE: "어드벤처",
  DRAMA: "드라마",
  ROMANCE: "로맨스",
  OUTDOOR: "야외",
  ETC: "기타",
});
export type ThemeGenre = (typeof THEME_GENRE.values)[number];

export const THEME_ACTIVITY = defineLabeledEnum({
  HIGH: "높음",
  MEDIUM: "보통",
  LOW: "적음",
});
export type ThemeActivityLevel = (typeof THEME_ACTIVITY.values)[number];

/** 카드·필터처럼 "활동성" 항목명 없이 단독으로 보일 때의 라벨. 예: "활동 높음" */
export function formatActivityLabel(level: ThemeActivityLevel): string {
  return `활동 ${THEME_ACTIVITY.label(level)}`;
}
