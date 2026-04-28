"use client";

import React, { useState } from "react";
import { useStore } from "@/lib/store";
import type { AddOn } from "@/lib/store";
import Link from "next/link";

export default function AddOnsPage() {
  const { state } = useStore();
  const { addOns, loading } = state;

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<AddOn | null>(null);

  const deleteAddOn = async (id: string) => {
    if (!confirm("Delete this add-on? This cannot be undone.")) return;
    await fetch(`/api/add-ons/${id}`, { method: "DELETE" });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Link href="/products" className="text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
             </Link>
             <h1 className="text-2xl font-extrabold text-primary font-headline">Add-Ons Management</h1>
          </div>
          <p className="text-sm text-on-surface-variant pl-8">
            Manage customizations available for POS orders.
          </p>
        </div>
        <button
          id="btn-add-addon"
          onClick={() => { setEditItem(null); setShowForm(true); }}
          className="bg-primary text-on-primary px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          New Add-On
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface-container-low">
            <tr>
              {["Name", "Price", "Status", "Actions"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 4 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-surface-container animate-pulse rounded w-28" />
                    </td>
                  ))}
                </tr>
              ))
            ) : addOns.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                  No add-ons yet. Add your first add-on to get started.
                </td>
              </tr>
            ) : (
              addOns.map((a) => (
                <tr key={a.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-primary">{a.name}</div>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold">₱{a.price.toFixed(2)}</td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${a.available ? "bg-green-100 text-green-700" : "bg-surface-container text-on-surface-variant"}`}>
                      {a.available ? "Available" : "Unavailable"}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setEditItem(a); setShowForm(true); }}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteAddOn(a.id)}
                        className="text-xs font-semibold text-error hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <AddOnForm
          initial={editItem}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ─── Add-On Form Modal ────────────────────────────────────────────────────────

function AddOnForm({ initial, onClose }: { initial: AddOn | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name:      initial?.name ?? "",
    price:     String(initial?.price ?? ""),
    available: initial ? initial.available : true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const save = async () => {
    if (!form.name || !form.price) {
      setError("Name and price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      name:      form.name,
      price:     parseFloat(form.price),
      available: form.available,
    };

    const res = initial
      ? await fetch(`/api/add-ons/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/add-ons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Failed to save add-on.");
    } else {
      onClose();
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-primary font-headline">
            {initial ? "Edit Add-On" : "New Add-On"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
             <label className="block text-sm font-semibold text-primary mb-1">Name *</label>
             <input
               type="text"
               value={form.name}
               onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
               placeholder="Extra Shot"
               className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm"
             />
          </div>
          <div>
             <label className="block text-sm font-semibold text-primary mb-1">Price (PHP) *</label>
             <input
               type="number"
               value={form.price}
               onChange={(e) => setForm(f => ({ ...f, price: e.target.value }))}
               placeholder="25.00"
               className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm"
             />
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-2">
             <input
               type="checkbox"
               checked={form.available}
               onChange={(e) => setForm(f => ({ ...f, available: e.target.checked }))}
               className="w-4 h-4 text-primary rounded focus:ring-primary"
             />
             <span className="text-sm font-semibold text-on-surface">Available for orders</span>
          </label>
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface-container font-semibold text-sm hover:bg-surface-dim">
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save Add-On"}
          </button>
        </div>
      </div>
    </div>
  );
}
