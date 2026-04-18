"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";

export default function SecondaryInsights() {
  const { state } = useStore();
  const { orders, products } = state;

  // Customer satisfaction (mock based on completed order ratio)
  const completed = orders.filter((o) => o.status === "Completed").length;
  const satisfactionPct =
    orders.length > 0 ? Math.min(100, Math.round((completed / orders.length) * 100)) : 0;

  // Find most critical low-stock product
  const criticalProducts = products
    .filter((p) => (p.stock ?? 0) <= 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));
  const alertProduct = criticalProducts[0];

  return (
    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Satisfaction ring */}
      <div className="bg-surface-container-high p-6 rounded-2xl flex items-center gap-6">
        <div className="relative w-24 h-24 shrink-0">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              strokeWidth="8"
              stroke="var(--color-surface-container-highest)"
            />
            <circle
              cx="44" cy="44" r="36"
              fill="none"
              strokeWidth="8"
              stroke="var(--color-primary)"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - satisfactionPct / 100)}`}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xl font-black text-primary font-headline">{satisfactionPct}%</span>
          </div>
        </div>
        <div>
          <h4 className="font-bold text-primary font-headline">Order Completion Rate</h4>
          <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
            {state.loading
              ? "Loading data…"
              : orders.length === 0
              ? "No orders yet. Start taking orders!"
              : `${completed} of ${orders.length} orders completed this period.`}
          </p>
        </div>
      </div>

      {/* Restock alert */}
      <div className="relative bg-primary-container p-6 rounded-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 scale-150 transform transition-transform group-hover:scale-125">
          <span className="material-symbols-outlined text-8xl">eco</span>
        </div>
        <div className="relative z-10">
          {alertProduct ? (
            <>
              <h4 className="font-bold text-on-primary-container font-headline flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">warning</span>
                Ritual Restock Alert
              </h4>
              <p className="text-sm text-on-primary-container/80 mt-1 max-w-[280px]">
                <strong>{alertProduct.name}</strong> has{" "}
                {alertProduct.stock ?? 0} unit{(alertProduct.stock ?? 0) !== 1 ? "s" : ""} left.
                Reorder now to keep the ritual flowing.
              </p>
              {criticalProducts.length > 1 && (
                <p className="text-xs text-on-primary-container/60 mt-1">
                  +{criticalProducts.length - 1} other{criticalProducts.length > 2 ? "s" : ""} need restocking
                </p>
              )}
            </>
          ) : (
            <>
              <h4 className="font-bold text-on-primary-container font-headline">Stock Looking Good</h4>
              <p className="text-sm text-on-primary-container/80 mt-1 max-w-[280px]">
                All products are sufficiently stocked. Keep up the great work!
              </p>
            </>
          )}
          <Link
            href="/products"
            className="mt-4 inline-block px-6 py-2 bg-white text-primary font-bold rounded-full text-xs hover:bg-surface transition-colors"
          >
            {alertProduct ? "Quick Restock →" : "View Inventory →"}
          </Link>
        </div>
      </div>
    </div>
  );
}
