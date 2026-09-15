import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type UserAuthErrorCode =
  | "AUTH_TOKEN_MISSING"
  | "AUTH_TOKEN_INVALID"
  | "AUTH_TOKEN_EXPIRED"
  | "AUTH_ACCOUNT_SUSPENDED"
  | "AUTH_ACCOUNT_WITHDRAWN";

export type UserAuthErrorResponse = ApiErrorResponse<UserAuthErrorCode>;
