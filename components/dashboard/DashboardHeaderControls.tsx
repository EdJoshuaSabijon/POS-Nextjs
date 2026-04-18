"use client";

import { useStore } from "@/lib/store";

export default function DashboardHeaderControls() {
  const { state } = useStore();

  const exportCSV = () => {
    // Generate an accurate export from the real-time global state
    const rows = [
      ["Order ID", "Customer", "Date", "Total", "Status"],
      ...state.orders.map((o) => [
        o.id,
        o.customer,
        o.date ?? "",
        `₱${(o.total ?? 0).toFixed(2)}`,
        o.status,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `marimono-dashboard-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex gap-3 relative">
      {/* Date Dropdown Filter */}
      <div className="relative">
        <select
            id="btn-date-filter"
            className="appearance-none pl-10 pr-8 py-2 bg-surface-container-highest text-primary font-semibold rounded-xl text-sm hover:bg-surface-dim transition-colors outline-none cursor-pointer h-full"
            defaultValue="7days"
        >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="alltime">All Time</option>
        </select>
        <span className="material-symbols-outlined text-[18px] absolute left-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
            calendar_today
        </span>
        <span className="material-symbols-outlined text-[18px] absolute right-3 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
            expand_more
        </span>
      </div>

      {/* Export CSV Button */}
      <button
        id="btn-export"
        onClick={exportCSV}
        className="px-4 py-2 bg-primary text-white font-semibold rounded-xl text-sm flex items-center gap-2 hover:opacity-90 transition-opacity whitespace-nowrap"
      >
        <span className="material-symbols-outlined text-[18px]">download</span>
        Export
      </button>
    </div>
  );
}
