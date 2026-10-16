import { z } from "zod";

import { nicknameFieldSchema } from "@/api/constant/AccountField.schema";

export const updateNicknameRequestSchema = z.object({
  nickname: nicknameFieldSchema,
});

export type UpdateNicknameRequest = z.infer<typeof updateNicknameRequestSchema>;
