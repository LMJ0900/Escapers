import apiClient from "@/api/ApiClient";

import type { LoginRequest } from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";
import type { LogoutRequest } from "@/api/domain/auth/logout/request/LogoutReq";
import type { ReissueRequest } from "@/api/domain/auth/reissue/request/ReissueReq";
import type { ReissueResponse } from "@/api/domain/auth/reissue/response/ReissueRes";
import type { SignupRequest } from "@/api/domain/auth/signup/request/SignupReq";
import type { SignupResponse } from "@/api/domain/auth/signup/response/SignupRes";

export class AuthMutation {
  static postLogin(req: LoginRequest): Promise<LoginResponse> {
    return apiClient<LoginResponse>({
      urlPath: "/auth/login",
      method: "POST",
      data: req,
    });
  }

  static postSignup(req: SignupRequest): Promise<SignupResponse> {
    return apiClient<SignupResponse>({
      urlPath: "/auth/signup",
      method: "POST",
      data: req,
      skipAuthHeader: true,
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

  static postLogout(req: LogoutRequest): Promise<null> {
    return apiClient<null>({
      urlPath: "/auth/logout",
      method: "POST",
      data: req,
    });
  }
}
