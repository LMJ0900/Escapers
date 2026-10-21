import apiClient from "@/api/ApiClient";

import type { PutReviewHelpfulRequest } from "@/api/domain/theme/putReviewHelpful/request/PutReviewHelpfulReq";
import type { PutReviewHelpfulResponse } from "@/api/domain/theme/putReviewHelpful/response/PutReviewHelpfulRes";
import type { PutThemeLikeRequest } from "@/api/domain/theme/putThemeLike/request/PutThemeLikeReq";
import type { PutThemeLikeResponse } from "@/api/domain/theme/putThemeLike/response/PutThemeLikeRes";

export class ThemeMutation {
  static putReviewHelpful({
    themeId,
    reviewId,
    helped,
  }: PutReviewHelpfulRequest): Promise<PutReviewHelpfulResponse> {
    return apiClient<PutReviewHelpfulResponse>({
      urlPath: `/theme/${themeId}/reviews/${reviewId}/helpful`,
      method: "PUT",
      data: { helped },
    });
  }

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
