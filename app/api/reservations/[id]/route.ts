import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(_request: Request, { params }: Params) {
  await releaseExpiredReservations();

  const { id } = await params;

  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: {
      product: true,
      warehouse: true,
    },
  });

  if (!reservation) {
    return NextResponse.json(
      { error: "Reservation not found." },
      { status: 404 }
    );
  }

  return NextResponse.json({ reservation });
}