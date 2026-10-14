import { z } from "zod";

import { emailFieldSchema } from "@/api/constant/AccountField.schema";

export const updateEmailRequestSchema = z.object({
  email: emailFieldSchema,
});

export type UpdateEmailRequest = z.infer<typeof updateEmailRequestSchema>;
