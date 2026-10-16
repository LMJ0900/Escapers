import apiClient from "@/api/ApiClient";

import type { PutThemeLikeRequest } from "@/api/domain/theme/putThemeLike/request/PutThemeLikeReq";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";

export class ThemeMutation {
  static putLike({
    themeId,
    liked,
  }: PutThemeLikeRequest): Promise<PutThemeLikeResponse> {
    return apiClient<PutThemeLikeResponse>({
      urlPath: `/theme/${themeId}/like`,
      method: "PUT",
      data: { liked },
    });
  }
}
