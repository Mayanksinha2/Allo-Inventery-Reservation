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

      if (reservation.status === ReservationStatus.CONFIRMED) {
        const confirmedReservation = await tx.reservation.findUnique({
          where: { id },
          include: {
            product: true,
            warehouse: true,
          },
        });

        return {
          type: "already_confirmed" as const,
          reservation: confirmedReservation,
        };
      }

      if (reservation.status === ReservationStatus.RELEASED) {
        return { type: "already_released" as const };
      }

      if (reservation.expiresAt <= new Date()) {
        await tx.reservation.update({
          where: { id },
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

        return { type: "expired" as const };
      }

      const confirmed = await tx.reservation.update({
        where: { id },
        data: {
          status: ReservationStatus.CONFIRMED,
          confirmedAt: new Date(),
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
          totalUnits: {
            decrement: reservation.quantity,
          },
          reservedUnits: {
            decrement: reservation.quantity,
          },
        },
      });

      return {
        type: "success" as const,
        reservation: confirmed,
      };
    });

    if (result.type === "not_found") {
      return NextResponse.json(
        { error: "Reservation not found." },
        { status: 404 }
      );
    }

    if (result.type === "expired") {
      return NextResponse.json(
        { error: "Reservation has expired." },
        { status: 410 }
      );
    }

    if (result.type === "already_released") {
      return NextResponse.json(
        { error: "Reservation was already released." },
        { status: 409 }
      );
    }

    return NextResponse.json({
      reservation: result.reservation,
      message:
        result.type === "already_confirmed"
          ? "Reservation was already confirmed."
          : "Purchase confirmed.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to confirm reservation." },
      { status: 500 }
    );
  }
}