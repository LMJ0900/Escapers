import apiClient from "@/api/ApiClient";

import type { LoginRequest } from "@/api/domain/auth/login/request/LoginReq";
import type { LoginResponse } from "@/api/domain/auth/login/response/LoginRes";

export class AuthMutation {
  static postLogin(req: LoginRequest): Promise<LoginResponse> {
    return apiClient<LoginResponse>({
      urlPath: "/auth/login",
      method: "POST",
      data: req,
    });
  }
}
