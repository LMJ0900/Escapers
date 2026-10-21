import type { ThemeSlotDay } from "@/api/domain/theme/Theme.type";

export interface getThemeSlotsResponse {
  /** 오늘부터 7일치. 날짜 오름차순 */
  days: ThemeSlotDay[];
}
