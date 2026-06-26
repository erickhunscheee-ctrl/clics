import { z } from "zod";

export const photoSchema = z.object({
  price: z.number().min(0, "O preco nao pode ser negativo"),
  status: z.enum(["ACTIVE", "HIDDEN"]).default("ACTIVE"),
  folderId: z.string().cuid().nullable().optional(),
});

export const batchPriceSchema = z.object({
  photoIds: z.array(z.string().cuid() || z.string()),
  price: z.number().min(0, "O preco nao pode ser negativo"),
});

export type PhotoSchemaInput = z.infer<typeof photoSchema>;
export type BatchPriceSchemaInput = z.infer<typeof batchPriceSchema>;
