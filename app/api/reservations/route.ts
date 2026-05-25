import { NextResponse } from "next/server";
import { ReservationStatus } from "@/app/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { createReservationSchema } from "@/lib/validation";
import { releaseExpiredReservations } from "@/lib/reservations";

const RESERVATION_MINUTES = 10;

export async function POST(request: Request) {
  await releaseExpiredReservations();

  const json = await request.json();
  const parsed = createReservationSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid request body",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { productId, warehouseId, quantity } = parsed.data;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const stock = await tx.stockLevel.findUnique({
        where: {
          productId_warehouseId: {
            productId,
            warehouseId,
          },
        },
      });

      if (!stock) {
        return {
          type: "not_found" as const,
        };
      }

      const updatedRows = await tx.$executeRaw`
        UPDATE "StockLevel"
        SET "reservedUnits" = "reservedUnits" + ${quantity},
            "updatedAt" = NOW()
        WHERE "id" = ${stock.id}
          AND ("totalUnits" - "reservedUnits") >= ${quantity}
      `;

      if (updatedRows !== 1) {
        return {
          type: "insufficient_stock" as const,
        };
      }

      const expiresAt = new Date(
        Date.now() + RESERVATION_MINUTES * 60 * 1000
      );

      const reservation = await tx.reservation.create({
        data: {
          productId,
          warehouseId,
          quantity,
          expiresAt,
          status: ReservationStatus.PENDING,
        },
        include: {
          product: true,
          warehouse: true,
        },
      });

      return {
        type: "success" as const,
        reservation,
      };
    });

    if (result.type === "not_found") {
      return NextResponse.json(
        { error: "Stock level not found for this product and warehouse." },
        { status: 404 }
      );
    }

    if (result.type === "insufficient_stock") {
      return NextResponse.json(
        { error: "Not enough stock available." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        reservation: result.reservation,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to create reservation." },
      { status: 500 }
    );
  }
}