import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type ThemeAuthErrorCode =
  "AUTH_TOKEN_MISSING" | "AUTH_TOKEN_INVALID" | "AUTH_TOKEN_EXPIRED";

export type PutThemeLikeErrorResponse = ApiErrorResponse<ThemeAuthErrorCode>;

export type GetThemeDetailErrorResponse = ApiErrorResponse<"THEME_NOT_FOUND">;

export type PutReviewHelpfulErrorResponse = ApiErrorResponse<
  ThemeAuthErrorCode | "THEME_NOT_FOUND" | "REVIEW_NOT_FOUND"
>;
