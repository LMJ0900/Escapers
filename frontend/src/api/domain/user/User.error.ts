import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type UserAuthErrorCode =
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_ACCOUNT_SUSPENDED"
  | "AUTH_ACCOUNT_WITHDRAWN";

export type UserAuthErrorResponse = ApiErrorResponse<UserAuthErrorCode>;

export type UpdateNicknameErrorCode =
  UserAuthErrorCode | "USER_NICKNAME_DUPLICATE";

export type UpdateNicknameErrorResponse =
  ApiErrorResponse<UpdateNicknameErrorCode>;

export type UpdateEmailErrorCode = UserAuthErrorCode | "USER_EMAIL_DUPLICATE";

export type UpdateEmailErrorResponse = ApiErrorResponse<UpdateEmailErrorCode>;

export type UpdatePasswordErrorCode =
  UserAuthErrorCode | "USER_CURRENT_PASSWORD_MISMATCH";

export type UpdatePasswordErrorResponse =
  ApiErrorResponse<UpdatePasswordErrorCode>;
