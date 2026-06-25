import { z } from "zod";

export const checkoutSchema = z.object({
  albumId: z.string().cuid(),
  photoIds: z.array(z.string().cuid()).min(1, "Selecione pelo menos uma foto"),
  customerPhone: z.string().optional().nullable(),
  customerDocument: z.string().optional().nullable(),
  paymentMethod: z.enum(["PIX", "CREDIT_CARD"]).default("PIX"),

  // Campos para checkout transparente (Cartao de Credito)
  cardToken: z.string().optional().nullable(),
  installments: z.number().int().positive().optional().nullable(),
  paymentMethodId: z.string().optional().nullable(),
  issuerId: z.number().int().positive().optional().nullable(),
});

export type CheckoutSchemaInput = z.infer<typeof checkoutSchema>;
