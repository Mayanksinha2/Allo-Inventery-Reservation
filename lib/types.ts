export type Product = {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  warehouses: {
    stockLevelId: string;
    warehouseId: string;
    warehouseName: string;
    city: string;
    totalUnits: number;
    reservedUnits: number;
    availableUnits: number;
  }[];
};

export type Reservation = {
  id: string;
  productId: string;
  warehouseId: string;
  quantity: number;
  status: "PENDING" | "CONFIRMED" | "RELEASED";
  expiresAt: string;
  confirmedAt: string | null;
  releasedAt: string | null;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  warehouse: {
    id: string;
    name: string;
    city: string;
  };
};