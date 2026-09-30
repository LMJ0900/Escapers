import apiClient from "@/api/ApiClient";

import type { getHotThemesResponse } from "@/api/domain/theme/getHotThemes/response/getHotThemesRes";

export class ThemeQuery {
  static readonly getHotThemesQueryKey = ["theme", "hot"] as const;

  static getHotThemes(): Promise<getHotThemesResponse> {
    return apiClient<getHotThemesResponse>({
      urlPath: "/theme/hot",
      method: "GET",
    });
  }
}
