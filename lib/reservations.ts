import { ReservationStatus } from "@/app/generated/prisma/enums";
import { prisma } from "./prisma";

export async function releaseExpiredReservations() {
  const now = new Date();

  const expired = await prisma.reservation.findMany({
    where: {
      status: ReservationStatus.PENDING,
      expiresAt: {
        lte: now,
      },
    },
    select: {
      id: true,
      productId: true,
      warehouseId: true,
      quantity: true,
    },
  });

  for (const reservation of expired) {
    await prisma.$transaction(async (tx) => {
      const latest = await tx.reservation.findUnique({
        where: { id: reservation.id },
      });

      if (!latest || latest.status !== ReservationStatus.PENDING) {
        return;
      }

      await tx.reservation.update({
        where: { id: reservation.id },
        data: {
          status: ReservationStatus.RELEASED,
          releasedAt: new Date(),
        },
      });

      await tx.stockLevel.update({
        where: {
          productId_warehouseId: {
            productId: reservation.productId,
            warehouseId: reservation.warehouseId,
          },
        },
        data: {
          reservedUnits: {
            decrement: reservation.quantity,
          },
        },
      });
    });
  }

  return {
    releasedCount: expired.length,
  };
}