"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [reservingKey, setReservingKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadProducts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load products.");
      }

      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function reserve(productId: string, warehouseId: string) {
    const key = `${productId}-${warehouseId}`;
    setReservingKey(key);
    setError("");

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId,
          warehouseId,
          quantity: 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reserve product.");
      }

      router.push(`/checkout/${data.reservation.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      await loadProducts();
    } finally {
      setReservingKey(null);
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Allo Inventory Reservation Demo
          </h1>
          <p className="mt-2 text-slate-600">
            Reserve stock for checkout, confirm payment, or release it back to
            inventory.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={loadProducts}
          className="mb-6 rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-700"
        >
          Refresh stock
        </button>

        {loading ? (
          <p>Loading products...</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {products.map((product) => (
              <div
                key={product.id}
                className="rounded-2xl border bg-white p-6 shadow-sm"
              >
                <div className="mb-4">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {product.name}
                  </h2>
                  <p className="text-sm text-slate-500">SKU: {product.sku}</p>
                  {product.description && (
                    <p className="mt-2 text-slate-600">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  {product.warehouses.map((warehouse) => {
                    const buttonKey = `${product.id}-${warehouse.warehouseId}`;
                    const isOutOfStock = warehouse.availableUnits <= 0;

                    return (
                      <div
                        key={warehouse.warehouseId}
                        className="flex items-center justify-between rounded-xl border p-4"
                      >
                        <div>
                          <p className="font-medium text-slate-900">
                            {warehouse.warehouseName}
                          </p>
                          <p className="text-sm text-slate-500">
                            {warehouse.city}
                          </p>
                          <p className="mt-1 text-sm">
                            Available:{" "}
                            <span className="font-semibold">
                              {warehouse.availableUnits}
                            </span>{" "}
                            / Total: {warehouse.totalUnits}
                          </p>
                          <p className="text-xs text-slate-500">
                            Reserved: {warehouse.reservedUnits}
                          </p>
                        </div>

                        <button
                          disabled={isOutOfStock || reservingKey === buttonKey}
                          onClick={() =>
                            reserve(product.id, warehouse.warehouseId)
                          }
                          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                          {isOutOfStock
                            ? "Out of stock"
                            : reservingKey === buttonKey
                              ? "Reserving..."
                              : "Reserve"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}