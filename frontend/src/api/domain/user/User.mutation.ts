import apiClient from "@/api/ApiClient";

import type { getMeResponse } from "@/api/domain/user/getMe/response/getMeRes";
import type { UpdateEmailRequest } from "@/api/domain/user/updateEmail/request/UpdateEmailReq";
import type { UpdateEmailResponse } from "@/api/domain/user/updateEmail/response/UpdateEmailRes";
import type { UpdateMarketingAgreeRequest } from "@/api/domain/user/updateMarketingAgree/request/UpdateMarketingAgreeReq";
import type { UpdateNicknameRequest } from "@/api/domain/user/updateNickname/request/UpdateNicknameReq";
import type { UpdateNicknameResponse } from "@/api/domain/user/updateNickname/response/UpdateNicknameRes";
import type { UpdatePasswordRequest } from "@/api/domain/user/updatePassword/request/UpdatePasswordReq";

export class UserMutation {
  static patchNickname(
    req: UpdateNicknameRequest
  ): Promise<UpdateNicknameResponse> {
    return apiClient<UpdateNicknameResponse>({
      urlPath: "/user/nickname",
      method: "PATCH",
      data: req,
    });
  }

  static patchEmail(req: UpdateEmailRequest): Promise<UpdateEmailResponse> {
    return apiClient<UpdateEmailResponse>({
      urlPath: "/user/email",
      method: "PATCH",
      data: req,
    });
  }

  static patchPassword(req: UpdatePasswordRequest): Promise<null> {
    return apiClient<null>({
      urlPath: "/user/password",
      method: "PATCH",
      data: req,
    });
  }

  static patchMarketingAgree(
    req: UpdateMarketingAgreeRequest
  ): Promise<getMeResponse> {
    return apiClient<getMeResponse>({
      urlPath: "/user/marketing-agree",
      method: "PATCH",
      data: req,
    });
  }

  static deleteMe(): Promise<null> {
    return apiClient<null>({
      urlPath: "/user/me",
      method: "DELETE",
    });
  }
}
