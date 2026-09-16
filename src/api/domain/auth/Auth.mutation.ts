import apiClient from "@/api/ApiClient";

import type { LoginRequest } from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";
import type { ReissueRequest } from "@/api/domain/auth/reissue/request/ReissueReq";
import type { ReissueResponse } from "@/api/domain/auth/reissue/response/ReissueRes";

export class AuthMutation {
  static postLogin(req: LoginRequest): Promise<LoginResponse> {
    return apiClient<LoginResponse>({
      urlPath: "/auth/login",
      method: "POST",
      data: req,
    });
  }

  static postReissue(req: ReissueRequest): Promise<ReissueResponse> {
    return apiClient<ReissueResponse>({
      urlPath: "/auth/reissue",
      method: "POST",
      data: req,
      skipAuthHeader: true,
    });
  }
}
