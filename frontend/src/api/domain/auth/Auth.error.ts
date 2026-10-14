import type { ApiErrorResponse } from "@/api/ApiErrorRes";

export type AuthSignupErrorCode =
  "AUTH_EMAIL_DUPLICATE" | "AUTH_NICKNAME_DUPLICATE";

export type AuthSignupErrorResponse = ApiErrorResponse<AuthSignupErrorCode>;
