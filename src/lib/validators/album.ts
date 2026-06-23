import { z } from "zod";

export const albumSchema = z.object({
  title: z.string().min(3, "O título deve ter pelo menos 3 caracteres").max(100, "O título não pode passar de 100 caracteres"),
  description: z.string().max(500, "A descrição não pode passar de 500 caracteres").optional().nullable(),
  eventDate: z.string().optional().nullable(),
  location: z.string().max(200, "O local não pode passar de 200 caracteres").optional().nullable(),
  defaultPhotoPrice: z.number().min(0, "O preço padrão não pode ser negativo").default(0),
});

export type AlbumSchemaInput = z.infer<typeof albumSchema>;
