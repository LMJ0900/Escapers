import { z } from "zod";

import {
  emailFieldSchema,
  passwordFieldSchema,
} from "@/api/constant/AccountField.schema";

export const loginRequestSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export type LoginRequest = z.infer<typeof loginRequestSchema>;
