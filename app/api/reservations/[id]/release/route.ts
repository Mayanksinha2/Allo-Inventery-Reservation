import { NextResponse } from "next/server";
import { ReservationStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const reservation = await tx.reservation.findUnique({
        where: { id },
      });

      if (!reservation) {
        return { type: "not_found" as const };
      }

      if (reservation.status === ReservationStatus.RELEASED) {
        const releasedReservation = await tx.reservation.findUnique({
          where: { id },
          include: {
            product: true,
            warehouse: true,
          },
        });

        return {
          type: "already_released" as const,
          reservation: releasedReservation,
        };
      }

      if (reservation.status === ReservationStatus.CONFIRMED) {
        return { type: "already_confirmed" as const };
      }

      const released = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.RELEASED,
          releasedAt: new Date(),
        },
        include: {
          product: true,
          warehouse: true,
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

      return {
        type: "success" as const,
        reservation: released,
      };
    });

    if (result.type === "not_found") {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (result.type === "already_confirmed") {
      return NextResponse.json(
        { error: "Confirmed reservations cannot be released." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      reservation: result.reservation,
      message:
        result.type === "already_released"
          ? "Reservation was already released."
          : "Reservation released.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to release reservation." },
      { status: 500 }
    );
  }
}