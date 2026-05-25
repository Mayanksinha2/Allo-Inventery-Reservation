import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { releaseExpiredReservations } from "@/lib/reservations";

export async function GET() {
  await releaseExpiredReservations();

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      stockLevels: {
        include: {
          warehouse: true,
        },
      },
    },
  });

  return NextResponse.json(
    products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      description: product.description,
      warehouses: product.stockLevels.map((stock) => ({
        stockLevelId: stock.id,
        warehouseId: stock.warehouseId,
        warehouseName: stock.warehouse.name,
        city: stock.warehouse.city,
        totalUnits: stock.totalUnits,
        reservedUnits: stock.reservedUnits,
        availableUnits: stock.totalUnits - stock.reservedUnits,
      })),
    }))
  );
}