export type UserRole = "ADMIN" | "MEMBER" | "OWNER";

export interface getMeResponse {
  id: string;
  role : UserRole;
  email: string;
  nickname: string;
}
