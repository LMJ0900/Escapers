import { handlers as authHandlers } from "@/mocks/handlers/auth";
import { handlers as reservationHandlers } from "@/mocks/handlers/reservation";
import { handlers as themeHandlers } from "@/mocks/handlers/theme";
import { handlers as themeDetailHandlers } from "@/mocks/handlers/themeDetail";
import { handlers as userHandlers } from "@/mocks/handlers/user";

/** browser.ts(클라이언트) · server.ts(서버)가 함께 쓰는 핸들러 목록. 새 도메인 핸들러는 여기에만 추가한다. */
export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...reservationHandlers,
  ...themeHandlers,
  ...themeDetailHandlers,
];
