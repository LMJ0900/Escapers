import apiClient from "@/api/ApiClient";

import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";

export class UserQuery {
  static readonly getMeQueryKey = ["user", "me"] as const;

  static getMe(): Promise<getMeResponse> {
    return apiClient<getMeResponse>({
      urlPath: "/user/getMe",
      method: "GET",
    });
  }
}
