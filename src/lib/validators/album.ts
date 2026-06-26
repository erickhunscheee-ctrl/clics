import { z } from "zod";

export const albumSchema = z.object({
  title: z
    .string()
    .min(3, "O titulo deve ter pelo menos 3 caracteres")
    .max(100, "O titulo nao pode passar de 100 caracteres"),
  description: z.string().max(500, "A descricao nao pode passar de 500 caracteres").optional().nullable(),
  eventDate: z.string().optional().nullable(),
  location: z.string().max(200, "O local nao pode passar de 200 caracteres").optional().nullable(),
  defaultPhotoPrice: z.number().min(0, "O preco padrao nao pode ser negativo").default(0),
  isFeatured: z.boolean().default(false),
  promotionEnabled: z.boolean().default(false),
  promotionMinPhotos: z.number().int().min(0, "A quantidade minima nao pode ser negativa").default(0),
  promotionDiscountPercent: z
    .number()
    .min(0, "O desconto nao pode ser negativo")
    .max(99.99, "O desconto nao pode passar de 99,99%")
    .default(0),
});

export type AlbumSchemaInput = z.infer<typeof albumSchema>;
