"use client";

import { useStore } from "@/lib/store";

const DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function SalesTrendsChart() {
  const { state } = useStore();
  const { orders } = state;

  // Build last-7-days revenue buckets
  const today = new Date();
  const buckets = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    const key = d.toISOString().slice(0, 10);
    const label = DAYS[d.getDay()];
    const revenue = orders
      .filter((o) => o.date?.slice(0, 10) === key)
      .reduce((sum, o) => sum + (o.total ?? 0), 0);
    return { label, revenue };
  });

  const maxRevenue = Math.max(...buckets.map((b) => b.revenue), 1);

  return (
    <div className="lg:col-span-2 bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-[0_40px_40px_-5px_rgba(27,28,25,0.06)]">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h3 className="text-xl font-bold text-primary font-headline">Sales Trends</h3>
          <p className="text-sm text-on-surface-variant">Daily revenue — last 7 days</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-primary" />
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Revenue</span>
          </div>
        </div>
      </div>

      <div className="relative h-64 w-full flex items-end justify-between px-2 gap-2">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-outline-variant/10 w-full h-0" />
          ))}
        </div>

        {buckets.map((b, i) => {
          const pct = maxRevenue > 0 ? (b.revenue / maxRevenue) * 100 : 0;
          const isToday = i === 6;
          return (
            <div key={i} className="flex-1 flex flex-col items-center group h-full relative">
              <div
                className={`w-full max-w-[40px] rounded-t-xl mt-auto relative transition-all duration-500 ${
                  isToday ? "bg-primary" : "bg-surface-container group-hover:bg-primary/60"
                }`}
                style={{ height: `${Math.max(pct, 4)}%` }}
                title={`₱${b.revenue.toFixed(2)}`}
              >
                {b.revenue > 0 && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₱{b.revenue.toFixed(0)}
                  </div>
                )}
              </div>
              <span className={`mt-4 text-xs font-bold ${isToday ? "text-primary" : "text-on-surface-variant"}`}>
                {b.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Summary row */}
      <div className="mt-6 pt-4 border-t border-outline-variant/10 flex items-center justify-between text-sm">
        <span className="text-on-surface-variant">
          Total this week:{" "}
          <span className="font-bold text-primary">
            ₱{buckets.reduce((s, b) => s + b.revenue, 0).toFixed(2)}
          </span>
        </span>
        {state.loading && (
          <span className="text-xs text-on-surface-variant animate-pulse">Loading…</span>
        )}
      </div>
    </div>
  );
}
