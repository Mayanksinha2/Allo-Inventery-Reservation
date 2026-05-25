import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({
  connectionString: process.env.DIRECT_URL!,
});

const prisma = new PrismaClient({
  adapter,
});

async function main() {
  await prisma.reservation.deleteMany();
  await prisma.stockLevel.deleteMany();
  await prisma.product.deleteMany();
  await prisma.warehouse.deleteMany();

  const bangalore = await prisma.warehouse.create({
    data: {
      name: "Bangalore Warehouse",
      city: "Bangalore",
    },
  });

  const delhi = await prisma.warehouse.create({
    data: {
      name: "Delhi Warehouse",
      city: "Delhi",
    },
  });

  const dress = await prisma.product.create({
    data: {
      name: "Girls Party Dress",
      sku: "GIRLS-DRESS-001",
      description: "Premium occasion wear dress for kids.",
    },
  });

  const shirt = await prisma.product.create({
    data: {
      name: "Boys Slim Fit Shirt",
      sku: "BOYS-SHIRT-001",
      description: "Smart casual slim fit shirt.",
    },
  });

  const kurta = await prisma.product.create({
    data: {
      name: "Ethnic Kurta Set",
      sku: "KURTA-SET-001",
      description: "Festive ethnic wear for kids.",
    },
  });

  await prisma.stockLevel.createMany({
    data: [
      {
        productId: dress.id,
        warehouseId: bangalore.id,
        totalUnits: 5,
        reservedUnits: 0,
      },
      {
        productId: dress.id,
        warehouseId: delhi.id,
        totalUnits: 3,
        reservedUnits: 0,
      },
      {
        productId: shirt.id,
        warehouseId: bangalore.id,
        totalUnits: 2,
        reservedUnits: 0,
      },
      {
        productId: shirt.id,
        warehouseId: delhi.id,
        totalUnits: 4,
        reservedUnits: 0,
      },
      {
        productId: kurta.id,
        warehouseId: bangalore.id,
        totalUnits: 1,
        reservedUnits: 0,
      },
      {
        productId: kurta.id,
        warehouseId: delhi.id,
        totalUnits: 6,
        reservedUnits: 0,
      },
    ],
  });
}

main()
  .then(async () => {
    console.log("Database seeded successfully.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });