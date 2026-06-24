import { z } from "zod";

export const checkoutSchema = z.object({
  albumId: z.string().cuid(),
  photoIds: z.array(z.string().cuid()).min(1, "Selecione pelo menos uma foto"),
  customerName: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
  customerEmail: z.string().email("E-mail inválido"),
  customerPhone: z.string().optional().nullable(),
  customerDocument: z.string().optional().nullable(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"]).default("PIX"),
  
  // Campos para checkout transparente (Cartão de Crédito)
  cardToken: z.string().optional().nullable(),
  installments: z.number().int().positive().optional().nullable(),
  paymentMethodId: z.string().optional().nullable(),
});

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>;

