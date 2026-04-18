"use client";

import { useStore } from "@/lib/store";

export default function StatCards() {
  const { state } = useStore();
  const { orders, products } = state;

  // Total sales today (orders with today's date)
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.date?.slice(0, 10) === today);
  const totalSalesToday = todayOrders.reduce((sum, o) => sum + (o.total ?? 0), 0);

  // Total orders count
  const totalOrders = orders.length;

  // Avg order value (all orders)
  const avgOrderValue = totalOrders > 0 ? orders.reduce((s, o) => s + o.total, 0) / totalOrders : 0;

  // Low stock alerts (stock <= 5)
  const lowStock = products.filter((p) => (p.stock ?? 0) <= 5).length;

  const cards = [
    {
      icon: "payments",
      iconBg: "bg-surface-container-highest",
      iconColor: "text-primary",
      label: "Total Sales Today",
      value: `₱${totalSalesToday.toFixed(2)}`,
      badge: todayOrders.length > 0 ? `${todayOrders.length} orders` : "No orders yet",
      badgeBg: "bg-secondary-container",
      badgeColor: "text-primary",
    },
    {
      icon: "shopping_bag",
      iconBg: "bg-secondary-container",
      iconColor: "text-secondary",
      label: "Total Orders",
      value: String(totalOrders),
      badge: "+live",
      badgeBg: "bg-secondary-container",
      badgeColor: "text-primary",
    },
    {
      icon: "analytics",
      iconBg: "bg-surface-container",
      iconColor: "text-primary",
      label: "Avg Order Value",
      value: `₱${avgOrderValue.toFixed(2)}`,
      badge: "Steady",
      badgeBg: "bg-surface-container",
      badgeColor: "text-on-surface-variant",
    },
    {
      icon: "warning",
      iconBg: "bg-error-container",
      iconColor: "text-error",
      label: "Low Stock Alerts",
      value: String(lowStock).padStart(2, "0"),
      badge: lowStock > 0 ? "Action Needed" : "All Good",
      badgeBg: lowStock > 0 ? "bg-error-container" : "bg-secondary-container",
      badgeColor: lowStock > 0 ? "text-error" : "text-primary",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/10 shadow-[0_40px_40px_-5px_rgba(27,28,25,0.06)] group"
        >
          <div className="flex justify-between items-start mb-4">
            <div className={`p-2 ${card.iconBg} ${card.iconColor} rounded-lg group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined">{card.icon}</span>
            </div>
            <span className={`text-xs font-bold ${card.badgeColor} ${card.badgeBg} px-2 py-1 rounded-full`}>
              {card.badge}
            </span>
          </div>
          <h3 className="text-on-surface-variant text-sm font-medium">{card.label}</h3>
          {state.loading ? (
            <div className="h-8 w-24 bg-surface-container animate-pulse rounded mt-1" />
          ) : (
            <p className="text-2xl font-black text-primary font-headline mt-1">{card.value}</p>
          )}
        </div>
      ))}
    </div>
  );
}
