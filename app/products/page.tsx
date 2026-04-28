"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Product } from "@/lib/store";

export default function ProductsPage() {
  const { state } = useStore();
  const { products, loading } = state;

  const [query, setQuery]       = useState("");
  const [category, setCategory] = useState("All");
  const [page, setPage]         = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["All", ...cats];
  }, [products]);

  const filtered = useMemo(() => {
    let list = [...products];
    if (category !== "All") list = list.filter((p) => p.category === category);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, category, query]);

  const perPage    = 8;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems  = filtered.slice((page - 1) * perPage, page * perPage);

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    await fetch(`/api/products/${id}`, { method: "DELETE" });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-primary font-headline">Inventory Management</h1>
          <p className="text-sm text-on-surface-variant">
            Manage ceremonial grades, accessories, and botanical blends.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <a
              href="/products/add-ons"
              className="bg-surface-container-highest text-primary px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:bg-surface-dim transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">settings_suggest</span>
              Manage Add-Ons
            </a>
            <button
              id="btn-add-product"
              onClick={() => { setEditItem(null); setShowForm(true); }}
              className="bg-primary text-on-primary px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Product
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c}
            id={`cat-${c.toLowerCase().replace(/\s+/g, "-")}`}
            onClick={() => { setCategory(c); setPage(1); }}
            className={`px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
              category === c
                ? "bg-primary text-on-primary"
                : "bg-surface-container-highest hover:bg-surface-dim"
            }`}
          >
            {c}
          </button>
        ))}
        <div className="relative ml-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            id="products-search"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder="Search by name or SKU…"
            className="pl-10 pr-4 py-2 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-sm outline-none focus:ring-1 focus:ring-primary w-60"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-surface-container-low">
            <tr>
              {["Product", "Category", "Price", "Stock", "Actions"].map((h) => (
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
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j} className="px-4 py-4">
                      <div className="h-4 bg-surface-container animate-pulse rounded w-28" />
                    </td>
                  ))}
                </tr>
              ))
            ) : pageItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-on-surface-variant">
                  {query || category !== "All"
                    ? "No products match your filters."
                    : "No products yet. Add your first product to get started."}
                </td>
              </tr>
            ) : (
              pageItems.map((p) => {
                const stock = p.stock ?? 0;
                const stockLabel = stock === 0 ? "Out of Stock" : stock <= 5 ? "Low Stock" : "In Stock";
                const stockColor =
                  stock === 0 ? "bg-red-100 text-red-700"
                  : stock <= 5 ? "bg-yellow-100 text-yellow-700"
                  : "bg-green-100 text-green-700";
                return (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-secondary-container flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-secondary text-[16px]">eco</span>
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-semibold text-primary">{p.name}</div>
                          {p.sku && <div className="text-xs text-on-surface-variant">SKU: {p.sku}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm">{p.category}</td>
                    <td className="px-4 py-4 text-sm font-semibold text-right">₱{p.price.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${stockColor}`}>
                        {stockLabel} {stock > 0 ? `(${stock})` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <button
                          id={`btn-edit-${p.id}`}
                          onClick={() => { setEditItem(p); setShowForm(true); }}
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          id={`btn-del-${p.id}`}
                          onClick={() => deleteProduct(p.id)}
                          className="text-xs font-semibold text-error hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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
          <div className="flex gap-1">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-2 py-1 rounded-lg bg-surface-container-highest" disabled={page === 1}>‹</button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} className={`px-3 py-1 rounded-lg ${page === i + 1 ? "bg-primary text-on-primary" : "bg-surface-container-highest"}`}>
                {i + 1}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-2 py-1 rounded-lg bg-surface-container-highest" disabled={page === totalPages}>›</button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <ProductForm
          initial={editItem}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
}

// ─── Product Form Modal ────────────────────────────────────────────────────────

function ProductForm({ initial, onClose }: { initial: Product | null; onClose: () => void }) {
  const [form, setForm] = useState({
    name:     initial?.name ?? "",
    category: initial?.category ?? "",
    price:    String(initial?.price ?? ""),
    stock:    String(initial?.stock ?? ""),
    sku:      initial?.sku ?? "",
    image:    initial?.image ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.category || !form.price) {
      setError("Name, category and price are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const body = {
      name:     form.name,
      category: form.category,
      price:    parseFloat(form.price),
      stock:    form.stock ? parseInt(form.stock) : 0,
      sku:      form.sku || null,
      image:    form.image || null,
    };

    const res = initial
      ? await fetch(`/api/products/${initial.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      : await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setError(err.error ?? "Failed to save product.");
    } else {
      onClose(); // realtime subscription will refresh the list
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-outline-variant/10">
          <h3 className="text-lg font-bold text-primary font-headline">
            {initial ? "Edit Product" : "Add Product"}
          </h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-surface-container text-on-surface-variant">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6 space-y-4">
          {[
            { label: "Product Name *", key: "name", type: "text", placeholder: "Ceremonial Origin A" },
            { label: "Category *",    key: "category", type: "text", placeholder: "Matcha Powder" },
            { label: "Price (PHP) *", key: "price", type: "number", placeholder: "48.00" },
            { label: "Stock (units)", key: "stock", type: "number", placeholder: "10" },
            { label: "SKU",           key: "sku", type: "text", placeholder: "RIT-MAT-001" },
            { label: "Upload Image",  key: "image", type: "file", placeholder: "" },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-semibold text-primary mb-1">{label}</label>
              {type === "file" ? (
                <div className="flex items-center gap-3">
                  <input
                    id={`field-${key}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      // Quick check for size to avoid payload too large (approx 2mb)
                      if (file.size > 2 * 1024 * 1024) {
                        alert("Please select an image under 2MB");
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        set("image", ev.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }}
                    className="w-full px-3 py-2 bg-surface-container-high rounded-lg text-sm outline-none file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-on-primary hover:file:opacity-90"
                  />
                  {form.image && form.image.length > 0 && typeof form.image === 'string' && (form.image.startsWith("data:image") || form.image.startsWith("http")) && (
                     <img src={form.image} alt="Preview" className="w-10 h-10 rounded-lg object-cover shadow-sm bg-white" />
                  )}
                </div>
              ) : (
                <input
                  id={`field-${key}`}
                  type={type}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 bg-surface-container-high rounded-lg outline-none focus:ring-1 focus:ring-primary text-sm"
                />
              )}
            </div>
          ))}
          {error && <p className="text-sm text-error">{error}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-surface-container font-semibold text-sm hover:bg-surface-dim">
            Cancel
          </button>
          <button
            id="btn-save-product"
            onClick={save}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 disabled:opacity-60"
          >
            {saving ? "Saving…" : initial ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </div>
  );
}
