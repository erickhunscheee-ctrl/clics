import { z } from "zod";

export const photoSchema = z.object({
  price: z.number().min(0, "O preço não pode ser negativo"),
  status: z.enum(["ACTIVE", "HIDDEN"]).default("ACTIVE"),
});

export const batchPriceSchema = z.object({
  photoIds: z.array(z.string().cuid() || z.string()),
  price: z.number().min(0, "O preço não pode ser negativo"),
});

export type PhotoSchemaInput = z.infer<typeof photoSchema>;
export type BatchPriceSchemaInput = z.infer<typeof batchPriceSchema>;
