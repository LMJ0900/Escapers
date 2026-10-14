import type { ThemeFacets, ThemeListItem } from "@/api/domain/theme/Theme.type";

export interface getThemesResponse {
  items: ThemeListItem[];
  nextCursor: string | null;
  totalCount: number;
  facets: ThemeFacets;
}
