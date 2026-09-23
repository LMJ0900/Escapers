import { setupServer } from "msw/node";

import { handlers as authHandlers } from "@/mocks/handlers/auth";
import { handlers as reservationHandlers } from "@/mocks/handlers/reservation";
import { handlers as userHandlers } from "@/mocks/handlers/user";

export const server = setupServer(
  ...authHandlers,
  ...userHandlers,
  ...reservationHandlers
);
