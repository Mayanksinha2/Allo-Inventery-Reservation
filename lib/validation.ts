import { z } from "zod";

export const createReservationSchema = z.object({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.number().int().positive(),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;