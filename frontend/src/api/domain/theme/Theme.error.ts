import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type ThemeAuthErrorCode =
  "AUTH_TOKEN_MISSING" | "AUTH_TOKEN_INVALID" | "AUTH_TOKEN_EXPIRED";

export type PutThemeLikeErrorResponse = ApiErrorResponse<ThemeAuthErrorCode>;
