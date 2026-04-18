"use client";

import { useStore } from "@/lib/store";
import Link from "next/link";

export default function BestSellingList() {
  const { state } = useStore();
  const { products, orders } = state;

  // Compute product sales volumes from orders
  const salesMap: Record<string, number> = {};
  for (const order of orders) {
    for (const item of order.items ?? []) {
      salesMap[item.name] = (salesMap[item.name] ?? 0) + (item.qty ?? 0);
    }
  }

  // Join with product catalog and sort by units sold
  const ranked = products
    .map((p) => ({ ...p, unitsSold: salesMap[p.name] ?? 0 }))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, 4);

  // Inventory health: % of products with stock > 0
  const inStockCount = products.filter((p) => (p.stock ?? 0) > 0).length;
  const inventoryHealth = products.length > 0 ? Math.round((inStockCount / products.length) * 100) : 0;

  return (
    <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-[0_40px_40px_-5px_rgba(27,28,25,0.06)]">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold text-primary font-headline">Best Selling</h3>
        <Link
          href="/products"
          className="text-xs font-bold text-on-surface-variant hover:text-primary transition-colors"
        >
          View All
        </Link>
      </div>

      <div className="space-y-4">
        {state.loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-3 rounded-xl animate-pulse">
              <div className="w-12 h-12 rounded-lg bg-surface-container" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-surface-container rounded w-3/4" />
                <div className="h-2 bg-surface-container rounded w-1/2" />
              </div>
            </div>
          ))
        ) : ranked.length === 0 ? (
          <p className="text-sm text-on-surface-variant py-4 text-center">
            No products yet.{" "}
            <Link href="/products" className="text-primary font-bold underline">
              Add your first product
            </Link>
          </p>
        ) : (
          ranked.map((p, i) => (
            <div
              key={p.id}
              className="flex items-center gap-4 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              {p.image ? (
                <img
                  src={p.image}
                  alt={p.name}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-secondary-container flex items-center justify-center text-secondary font-bold text-lg">
                  {i + 1}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-primary truncate">{p.name}</p>
                <p className="text-xs text-on-surface-variant">
                  {p.unitsSold > 0 ? `${p.unitsSold} units sold` : "No sales yet"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-primary font-headline">
                  ₱{(p.price * p.unitsSold).toFixed(0)}
                </p>
                <span className="text-[10px] text-on-surface-variant font-bold">
                  ₱{p.price.toFixed(2)}/ea
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Inventory health bar */}
      <div className="mt-8 pt-6 border-t border-outline-variant/10">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-on-surface-variant">Inventory Health</span>
          <span className="text-sm font-bold text-primary">{inventoryHealth}%</span>
        </div>
        <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
          <div
            className="bg-primary h-full rounded-full transition-all duration-700"
            style={{ width: `${inventoryHealth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
