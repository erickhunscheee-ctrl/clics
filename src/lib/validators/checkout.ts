import { z } from "zod";

export const checkoutSchema = z.object({
  albumId: z.string().cuid() || z.string(),
  photoIds: z.array(z.string()),
  customerName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().min(10, "Telefone inválido (use o formato com DDD)"),
  customerDocument: z.string().optional().nullable(),
});

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>;
