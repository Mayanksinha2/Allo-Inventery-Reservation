"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import type { Reservation } from "@/lib/types";

export default function CheckoutPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [now, setNow] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const remainingMs = useMemo(() => {
    if (!reservation) return 0;
    return Math.max(new Date(reservation.expiresAt).getTime() - now, 0);
  }, [reservation, now]);

  const remainingSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  async function loadReservation() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/reservations/${params.id}`, {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to load reservation.");
      }

      setReservation(data.reservation);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmPurchase() {
    setActionLoading("confirm");
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${params.id}/confirm`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to confirm purchase.");
      }

      setReservation(data.reservation);
      setMessage(data.message || "Purchase confirmed.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      await loadReservation();
    } finally {
      setActionLoading("");
    }
  }

  async function cancelReservation() {
    setActionLoading("cancel");
    setError("");
    setMessage("");

    try {
      const response = await fetch(`/api/reservations/${params.id}/release`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to cancel reservation.");
      }

      setReservation(data.reservation);
      setMessage(data.message || "Reservation cancelled.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      await loadReservation();
    } finally {
      setActionLoading("");
    }
  }

  useEffect(() => {
    loadReservation();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <p>Loading reservation...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-2xl">
        <button
          onClick={() => router.push("/")}
          className="mb-6 text-sm font-medium text-blue-600 hover:underline"
        >
          ← Back to products
        </button>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Checkout</h1>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              {message}
            </div>
          )}

          {!reservation ? (
            <p className="mt-4">Reservation not found.</p>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Product</p>
                <p className="text-lg font-semibold">
                  {reservation.product.name}
                </p>
                <p className="text-sm text-slate-500">
                  SKU: {reservation.product.sku}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Warehouse</p>
                <p className="text-lg font-semibold">
                  {reservation.warehouse.name}
                </p>
                <p className="text-sm text-slate-500">
                  {reservation.warehouse.city}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Quantity</p>
                <p className="text-lg font-semibold">
                  {reservation.quantity}
                </p>
              </div>

              <div className="rounded-xl border p-4">
                <p className="text-sm text-slate-500">Status</p>
                <p className="text-lg font-semibold">
                  {reservation.status}
                </p>
              </div>

              {reservation.status === "PENDING" && (
                <div className="rounded-xl border p-4">
                  <p className="text-sm text-slate-500">Time remaining</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {minutes}:{seconds.toString().padStart(2, "0")}
                  </p>
                  {remainingMs === 0 && (
                    <p className="mt-2 text-sm text-red-600">
                      This reservation has expired. Confirming now will return
                      410.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  disabled={
                    reservation.status !== "PENDING" ||
                    actionLoading === "confirm"
                  }
                  onClick={confirmPurchase}
                  className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === "confirm"
                    ? "Confirming..."
                    : "Confirm purchase"}
                </button>

                <button
                  disabled={
                    reservation.status !== "PENDING" ||
                    actionLoading === "cancel"
                  }
                  onClick={cancelReservation}
                  className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {actionLoading === "cancel" ? "Cancelling..." : "Cancel"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}