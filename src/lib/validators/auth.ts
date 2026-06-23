import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres").optional(),
});

export type AuthSchemaInput = z.infer<typeof authSchema>;
