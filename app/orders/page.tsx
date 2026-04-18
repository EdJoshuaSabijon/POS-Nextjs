"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Order } from "@/lib/store";

type StatusType = "All" | Order["status"];

function StatusBadge({ status }: { status: Order["status"] }) {
  const map: Record<Order["status"], string> = {
    Pending:    "bg-yellow-100 text-yellow-800",
    Processing: "bg-blue-100 text-blue-800",
    Completed:  "bg-green-100 text-green-800",
    Cancelled:  "bg-red-100 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${map[status]}`}>
      {status}
    </span>
  );
}

export default function OrdersPage() {
  const { state } = useStore();
  const { orders, loading } = state;

  const [query, setQuery]   = useState("");
  const [status, setStatus] = useState<StatusType>("All");
  const [selected, setSelected] = useState<Order | null>(null);
  const [page, setPage]     = useState(1);
  const perPage = 8;

  // Derived / filtered
  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchQ = [o.id, o.customer].join(" ").toLowerCase().includes(query.toLowerCase());
      const matchS = status === "All" || o.status === status;
      return matchQ && matchS;
    });
  }, [orders, query, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems  = filtered.slice((page - 1) * perPage, page * perPage);

  // CRUD handlers
  const updateStatus = async (id: string, newStatus: Order["status"]) => {
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setSelected(null); // realtime will refresh
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Delete this order? This cannot be undone.")) return;
    await fetch(`/api/orders/${id}`, { method: "DELETE" });
  };

  const exportCSV = () => {
    const rows = [
      ["Order ID", "Customer", "Date", "Total", "Status"],
      ...filtered.map((o) => [o.id, o.customer, o.date ?? "", `₱${o.total.toFixed(2)}`, o.status]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary font-headline">Orders</h1>
          <p className="text-sm text-on-surface-variant">Manage order history and status</p>
        </div>
        <button
          id="btn-export-orders"
          onClick={exportCSV}
          className="bg-primary text-on-primary px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">download</span>
          Export CSV
        </button>
      </div>


      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface-container-low">
            <tr>
              {["Order", "Customer", "Date", "Total"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-surface-container animate-pulse rounded w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-on-surface-variant text-sm">
                  {query || status !== "All"
                    ? "No orders match your filters."
                    : "No orders yet. Complete a checkout in POS to see orders here."}
                </td>
              </tr>
            ) : (
              pageItems.map((o) => (
                <tr key={o.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-4 font-medium text-sm text-primary">{o.id}</td>
                  <td className="px-4 py-4 text-sm">{o.customer}</td>
                  <td className="px-4 py-4 text-sm text-on-surface-variant">
                    {o.date ? new Date(o.date).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-right">
                    ₱{o.total.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">
            Showing {Math.min((page - 1) * perPage + 1, filtered.length)}–
            {Math.min(page * perPage, filtered.length)} of {filtered.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-2 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim disabled:opacity-40"
              disabled={page === 1}
            >‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-1 rounded-lg ${
                  page === i + 1
                    ? "bg-primary text-on-primary"
                    : "bg-surface-container-highest hover:bg-surface-dim"
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-2 py-1 rounded-lg bg-surface-container-highest hover:bg-surface-dim disabled:opacity-40"
              disabled={page === totalPages}
            >›</button>
          </div>
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
              <h3 className="text-lg font-bold text-primary font-headline">
                Order {selected.id}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-on-surface-variant">Customer</span>
                  <p className="font-semibold text-primary mt-0.5">{selected.customer}</p>
                </div>
                <div>
                  <span className="text-on-surface-variant">Date</span>
                  <p className="font-semibold mt-0.5">
                    {selected.date ? new Date(selected.date).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div>
                  <span className="text-on-surface-variant">Status</span>
                  <div className="mt-0.5">
                    <StatusBadge status={selected.status} />
                  </div>
                </div>
                <div>
                  <span className="text-on-surface-variant">Total</span>
                  <p className="font-black text-primary font-headline text-lg mt-0.5">
                    ₱{selected.total.toFixed(2)}
                  </p>
                </div>
              </div>

              {selected.items?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-2">Items</h4>
                  <ul className="space-y-1">
                    {selected.items.map((it, i) => (
                      <li key={i} className="flex justify-between text-sm text-on-surface-variant">
                        <span>{it.name} × {it.qty}</span>
                        <span>₱{(it.price * it.qty).toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Status update buttons */}
              {selected.status !== "Completed" && selected.status !== "Cancelled" && (
                <div className="flex gap-2 pt-2">
                  {selected.status === "Pending" && (
                    <button
                      onClick={() => updateStatus(selected.id, "Processing")}
                      className="flex-1 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90"
                    >
                      Mark Processing
                    </button>
                  )}
                  <button
                    onClick={() => updateStatus(selected.id, "Completed")}
                    className="flex-1 py-2 bg-primary text-on-primary rounded-xl font-semibold text-sm hover:opacity-90"
                  >
                    Mark Completed
                  </button>
                  <button
                    onClick={() => updateStatus(selected.id, "Cancelled")}
                    className="flex-1 py-2 bg-error-container text-error rounded-xl font-semibold text-sm hover:opacity-90"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
