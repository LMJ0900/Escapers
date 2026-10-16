import type {
  ThemeActivityLevel,
  ThemeGenre,
} from "../../generated/prisma/enums";

// facets 의 표시 라벨. 프론트 src/api/domain/theme/Theme.filter.ts 의 GENRE_LABEL · ACTIVITY_LABEL 과 같은 문구를 쓴다.
// 객체 키 순서가 곧 facets 옵션 순서다.

export const GENRE_LABEL: Record<ThemeGenre, string> = {
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
};

export const ACTIVITY_LABEL: Record<ThemeActivityLevel, string> = {
  HIGH: "활동 높음",
  MEDIUM: "활동 보통",
  LOW: "활동 적음",
};
