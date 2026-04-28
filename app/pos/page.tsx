"use client";

import React, { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { Product, AddOn } from "@/lib/store";

type SelectedAddOn = { id: string; name: string; price: number };
type CartItem = { product: Product; quantity: number; addOns: SelectedAddOn[] };

const CATEGORIES_DEFAULT = ["All", "Drinks", "Snacks", "Merchandise", "Tea Bags"];

// Quick cash amounts for the mocked checkout keypad
const QUICK_AMOUNTS = [20, 50, 100, 500];

export default function POSPage() {
  const { state } = useStore();
  const { products, addOns, loading } = state;

  const [selectedCat, setSelectedCat] = useState("All");
  const [cart, setCart]               = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [checkingOut, setCheckingOut]   = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  // Add-on selector state
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);

  type ReceiptData = {
    id: string;
    items: { name: string; qty: number; price: number; addOns?: SelectedAddOn[] }[];
    subtotal: number;
    tax: number;
    total: number;
    amountTendered: number;
    change: number;
    customerName: string;
    date: string;
  };
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [receipt, setReceipt]           = useState<ReceiptData | null>(null);

  // Dynamic categories from DB, fallback to defaults during load
  const categories = useMemo(() => {
    if (products.length === 0) return CATEGORIES_DEFAULT;
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return ["All", ...cats];
  }, [products]);

  const visibleProducts = useMemo(() => {
    if (selectedCat === "All") return products;
    return products.filter((p) => p.category === selectedCat);
  }, [products, selectedCat]);

  // ── Cart helpers ──────────────────────────────────────────────────────────
  const availableAddOns = useMemo(() => addOns.filter((a: AddOn) => a.available), [addOns]);

  const handleProductTap = (p: Product) => {
    // If there are add-ons available, show the add-on picker
    if (availableAddOns.length > 0) {
      setPendingProduct(p);
      setSelectedAddOns([]);
      setShowAddOnModal(true);
    } else {
      addToCartDirect(p, []);
    }
  };

  const confirmAddOns = () => {
    if (!pendingProduct) return;
    const chosen = availableAddOns
      .filter((a: AddOn) => selectedAddOns.includes(a.id))
      .map((a: AddOn) => ({ id: a.id, name: a.name, price: a.price }));
    addToCartDirect(pendingProduct, chosen);
    setShowAddOnModal(false);
    setPendingProduct(null);
    setSelectedAddOns([]);
  };

  const addToCartDirect = (p: Product, addOnsList: SelectedAddOn[]) =>
    setCart((items) => {
      // Check if an identical item+addOns combo exists
      const addOnKey = addOnsList.map(a => a.id).sort().join(",");
      const ex = items.find((ci) => {
        const ciKey = ci.addOns.map(a => a.id).sort().join(",");
        return ci.product.id === p.id && ciKey === addOnKey;
      });
      if (ex) return items.map((ci) => {
        const ciKey = ci.addOns.map(a => a.id).sort().join(",");
        return ci.product.id === p.id && ciKey === addOnKey ? { ...ci, quantity: ci.quantity + 1 } : ci;
      });
      return [...items, { product: p, quantity: 1, addOns: addOnsList }];
    });

  const cartItemKey = (ci: CartItem) => ci.product.id + "|" + ci.addOns.map(a => a.id).sort().join(",");

  const updateQty = (key: string, delta: number) =>
    setCart((items) =>
      items
        .map((ci) => cartItemKey(ci) === key ? { ...ci, quantity: Math.max(0, ci.quantity + delta) } : ci)
        .filter((ci) => ci.quantity > 0)
    );

  const removeFromCart = (key: string) =>
    setCart((items) => items.filter((ci) => cartItemKey(ci) !== key));

  const getItemTotal = (ci: CartItem) => {
    const addOnTotal = ci.addOns.reduce((s, a) => s + a.price, 0);
    return (ci.product.price + addOnTotal) * ci.quantity;
  };

  const subtotal = cart.reduce((s, ci) => s + getItemTotal(ci), 0);
  const tax      = 0;
  const total    = subtotal;

  // ── Change calculation ────────────────────────────────────────────────────
  const tenderedNum = parseFloat(amountTendered) || 0;
  const change = tenderedNum - total;
  const isInsufficient = amountTendered !== "" && change < 0;

  const handleKeypad = (val: string) => {
    if (val === 'C') {
      setAmountTendered("");
    } else if (val === 'DEL') {
      setAmountTendered((prev) => prev.slice(0, -1));
    } else {
      // prevent leading zeros unless it's a decimal
      if (amountTendered === "" && val === "00") return;
      if (amountTendered.includes('.') && val === '.') return;
      setAmountTendered((prev) => prev + val);
    }
  };

  const handleQuickAmount = (amount: number) => {
    setAmountTendered(amount.toString());
  };

  const openCheckout = () => {
    if (cart.length === 0) return;
    setAmountTendered(total.toFixed(2));
    setShowPayModal(true);
  };

  // ── Checkout → creates Supabase order ─────────────────────────────────────
  const completeCheckout = async () => {
    setCheckingOut(true);
    try {
      const body = {
        customer: customerName.trim() || "Walk-in Customer",
        items: cart.map((ci) => ({
          name:  ci.product.name,
          qty:   ci.quantity,
          price: ci.product.price,
          addOns: ci.addOns,
        })),
        total: total
      };
      const res = await fetch("/api/orders", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(body),
      });
      if (res.ok) {
        const order = await res.json();
        setReceipt({
          id: order?.[0]?.id ?? "ORDER",
          items: cart.map(ci => ({ name: ci.product.name, qty: ci.quantity, price: ci.product.price, addOns: ci.addOns })),
          subtotal,
          tax,
          total,
          amountTendered: tenderedNum,
          change: change > 0 ? change : 0,
          customerName: customerName.trim(),
          date: new Date().toLocaleString()
        });
        setCart([]);
        setCustomerName("");
        setShowPayModal(false);
      } else {
        alert("Checkout failed. Please try again.");
      }
    } catch {
      alert("Network error. Check your connection.");
    }
    setCheckingOut(false);
  };

  return (
    <div className="flex bg-[#e4e2dd] h-[calc(100vh-64px)] overflow-hidden font-inter relative selection:bg-primary/20">
      
      {/* ── Left: Product Dashboard ─────────────────────────────────────────────── */}
      <section className="flex-[7] flex flex-col overflow-hidden relative">
        {/* Top subtle gradient glow for glass effect */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/40 to-transparent pointer-events-none z-10" />

        {/* Categories Strip */}
        <div className="pt-6 px-6 pb-2 shrink-0 z-20">
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-4 snap-x">
            {categories.map((c) => {
              const isSelected = c === selectedCat;
              return (
                <button
                  key={c}
                  id={`pos-cat-${c.toLowerCase().replace(/\s+/g, "-")}`}
                  onClick={() => setSelectedCat(c)}
                  className={`snap-start whitespace-nowrap px-6 py-3 rounded-2xl text-sm font-bold tracking-wide transition-all duration-300 shadow-sm ${
                    isSelected
                      ? "bg-primary text-white shadow-primary/20 scale-105"
                      : "bg-surface-container-lowest text-on-surface hover:bg-white hover:shadow-md hover:-translate-y-0.5"
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid Layout */}
        <div className="flex-1 overflow-y-auto p-6 pt-0 custom-scrollbar z-0">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="bg-surface-container-lowest rounded-3xl p-4 animate-pulse shadow-sm h-[220px] flex flex-col">
                  <div className="flex-1 bg-surface-container rounded-2xl mb-4" />
                  <div className="h-4 bg-surface-container rounded-full w-3/4 mb-3" />
                  <div className="h-4 bg-surface-container rounded-full w-1/2" />
                </div>
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-on-surface-variant gap-4">
              <div className="w-24 h-24 rounded-full bg-white/50 flex items-center justify-center backdrop-blur-sm shadow-inner">
                <span className="material-symbols-outlined text-5xl opacity-40">inventory_2</span>
              </div>
              <p className="text-lg font-medium opacity-60">No items found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 pb-20">
              {visibleProducts.map((p) => {
                const inCart = cart.find((ci) => ci.product.id === p.id);
                return (
                  <button
                    key={p.id}
                    id={`btn-add-${p.id}`}
                    onClick={() => {
                        handleProductTap(p);
                    }}
                    className="relative bg-surface-container-lowest rounded-3xl p-3 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 text-left group overflow-hidden h-[240px]"
                  >
                    {/* Selected Indicator overlay */}
                    {inCart && (
                        <div className="absolute top-4 right-4 z-20 w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 border-2 border-white scale-in-center overflow-hidden">
                            <span className="text-white text-xs font-black">{inCart.quantity}</span>
                        </div>
                    )}
                    
                    <div className="h-32 w-full rounded-2xl mb-4 overflow-hidden bg-gradient-to-br from-surface-container to-surface flex items-center justify-center shrink-0 relative">
                        {p.image ? (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          />
                        ) : (
                          <span className="material-symbols-outlined text-secondary text-5xl opacity-80 group-hover:scale-110 transition-transform duration-500">eco</span>
                        )}
                        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex flex-col flex-1 px-1">
                      <p className="text-[15px] font-bold text-on-surface leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                        {p.name}
                      </p>
                      <div className="mt-auto flex items-end justify-between">
                        <span className="text-lg font-black text-primary tracking-tight">
                          ₱{p.price.toFixed(2)}
                        </span>
                        {/* Optional small + icon to reinforce it's a button */}
                        <div className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface opacity-0 group-hover:opacity-100 transition-all transform group-hover:scale-100 scale-75">
                            <span className="material-symbols-outlined text-[18px]">add</span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ── Right: Premium Cart Pane ─────────────────────────────────────────────── */}
      <aside className="w-[420px] shrink-0 bg-white shadow-[-20px_0_40px_-10px_rgba(0,0,0,0.05)] border-l border-outline-variant/10 flex flex-col z-20 relative">
        
        {/* Cart Header */}
        <div className="p-6 pb-4 bg-white/80 backdrop-blur-xl z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black text-primary font-headline tracking-tight flex items-center gap-2">
                <span className="material-symbols-outlined text-[28px]">shopping_cart</span>
                Current Order
            </h2>
            <div className="px-3 py-1 bg-surface-container-highest rounded-full text-sm font-bold text-on-surface-variant flex items-center gap-1.5 shadow-inner">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Ticket #{Math.floor(Math.random() * 1000).toString().padStart(4, '0')}
            </div>
          </div>
          
          <div className="relative group">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">
                person
            </span>
            <input
              id="pos-customer-name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Add Customer Name (Optional)"
              className="w-full pl-12 pr-4 py-3.5 bg-[#fbf9f4] border border-outline-variant/20 rounded-2xl text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:font-normal shadow-sm"
            />
          </div>
        </div>

        {/* Cart items List */}
        <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-4 custom-scrollbar bg-gradient-to-b from-white to-[#fbf9f4]/30">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4 animate-in fade-in duration-500">
              <div className="w-32 h-32 mb-6 rounded-full bg-surface-container flex items-center justify-center border-8 border-white shadow-xl shadow-black/5">
                <span className="material-symbols-outlined text-6xl text-on-surface-variant opacity-30">receipt_long</span>
              </div>
              <h3 className="text-xl font-bold text-primary tracking-tight">Your cart is empty</h3>
              <p className="text-sm text-on-surface-variant mt-2 font-medium">Tap items from the menu to start building an order.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((ci) => (
                <div key={cartItemKey(ci)} className="relative bg-white rounded-2xl p-4 shadow-sm border border-outline-variant/20 group hover:border-primary/30 transition-colors animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-start justify-between gap-3 mb-1">
                    <div className="flex-1 min-w-0 pr-2">
                        <p className="font-bold text-[#14341d] leading-tight text-[15px]">{ci.product.name}</p>
                    </div>
                    <p className="font-black text-primary text-lg shrink-0">
                        ₱{getItemTotal(ci).toFixed(2)}
                    </p>
                  </div>
                  
                  {ci.addOns.length > 0 ? (
                    <div className="mb-3 space-y-1">
                      {ci.addOns.map((addOn) => (
                        <div key={addOn.id} className="flex justify-between items-center text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">add</span> {addOn.name}</span>
                          <span>₱{addOn.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-on-surface-variant font-semibold mt-1 mb-3">
                      ₱{ci.product.price.toFixed(2)} / ea
                    </p>
                  )}
                  
                  {/* Quantity Control Row inside Cart Card */}
                  <div className="flex items-center justify-between border-t border-outline-variant/10 pt-3 mt-1">
                      <button
                        title="Remove"
                        onClick={() => removeFromCart(cartItemKey(ci))}
                        className="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-full hover:bg-error/10 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                      
                      <div className="flex items-center bg-surface-container-lowest rounded-full p-1 border border-outline-variant/20 shadow-inner">
                        <button 
                          onClick={() => updateQty(cartItemKey(ci), -1)} 
                          className="w-9 h-9 rounded-full bg-white text-on-surface flex items-center justify-center shadow-sm hover:bg-surface transition-colors active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">remove</span>
                        </button>
                        <span className="w-10 text-center font-bold text-[#14341d] text-[15px]">{ci.quantity}</span>
                        <button 
                          onClick={() => updateQty(cartItemKey(ci), 1)} 
                          className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-sm hover:scale-105 transition-transform active:scale-95"
                        >
                            <span className="material-symbols-outlined text-[20px]">add</span>
                        </button>
                      </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Checkout Floating Panel */}
        <div className="mt-auto bg-white rounded-t-3xl shadow-[0_-15px_40px_-15px_rgba(0,0,0,0.1)] relative z-20 border-t border-outline-variant/10 pt-4 pb-6 px-6">
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-on-surface-variant text-[15px] font-semibold">
              <span>Subtotal</span><span>₱{subtotal.toFixed(2)}</span>
            </div>
            {/* Dashed divider */}
            <div className="w-full border-t-2 border-dashed border-outline-variant/30 my-2" />
            <div className="flex justify-between items-end">
              <span className="text-lg font-bold text-primary">Total Pay</span>
              <span className="text-4xl font-black text-primary font-headline tracking-tighter">₱{total.toFixed(2)}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
              <button
                id="btn-clear-cart"
                onClick={() => setCart([])}
                disabled={cart.length === 0}
                className="w-16 h-16 shrink-0 rounded-2xl bg-surface-container-highest text-on-surface-variant flex items-center justify-center hover:bg-error-container hover:text-error transition-colors disabled:opacity-40 disabled:hover:bg-surface-container-highest disabled:hover:text-on-surface-variant"
                title="Clear Cart"
              >
                <span className="material-symbols-outlined text-3xl">delete_sweep</span>
              </button>
              
              <button
                id="btn-checkout"
                onClick={openCheckout}
                disabled={cart.length === 0}
                className="flex-1 h-16 relative overflow-hidden rounded-2xl bg-primary text-white font-black text-xl flex items-center justify-center gap-3 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                  {/* Shine effect */}
                  <div className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[200%] skew-x-[-30deg] animate-[shimmer_3s_infinite]" />
                  <span className="material-symbols-outlined text-[26px]">credit_card</span>
                  PAY
              </button>
          </div>
        </div>
      </aside>

      {/* ── Add-On Selection Modal ─────────────────────────────────────────────────── */}
      {showAddOnModal && pendingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in p-4">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 border-b border-outline-variant/10 bg-[#fbf9f4]">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-black text-primary font-headline">Customize Order</h3>
                <button onClick={() => setShowAddOnModal(false)} className="text-on-surface-variant hover:text-primary transition-colors bg-surface-container-highest rounded-full p-1">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
              <p className="text-sm font-bold text-[#14341d]">{pendingProduct.name}</p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
              {availableAddOns.map((addOn: AddOn) => {
                const isSelected = selectedAddOns.includes(addOn.id);
                return (
                  <label key={addOn.id} className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-outline-variant/20 hover:border-primary/40'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border-2 ${isSelected ? 'bg-primary border-primary text-white' : 'border-outline-variant/40'}`}>
                        {isSelected && <span className="material-symbols-outlined text-[16px]">check</span>}
                      </div>
                      <span className="font-bold text-[15px]">{addOn.name}</span>
                    </div>
                    <span className="font-black text-primary">+₱{addOn.price.toFixed(2)}</span>
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={isSelected}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedAddOns([...selectedAddOns, addOn.id]);
                        else setSelectedAddOns(selectedAddOns.filter(id => id !== addOn.id));
                      }}
                    />
                  </label>
                );
              })}
            </div>
            
            <div className="p-6 border-t border-outline-variant/10 bg-white">
              <button 
                onClick={confirmAddOns}
                className="w-full bg-primary text-white rounded-xl py-4 font-black text-lg hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
              >
                Add to Cart • ₱{(pendingProduct.price + availableAddOns.filter((a: AddOn) => selectedAddOns.includes(a.id)).reduce((s: number, a: AddOn) => s + a.price, 0)).toFixed(2)}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Checkout / Payment Modal (Glassmorphic) ─────────────────────────────────────────────────── */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/40 backdrop-blur-md animate-in fade-in p-4 xl:p-8">
          <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl flex overflow-hidden border border-white max-h-[90vh]">
            
            {/* Left side: Order Summary & Keypad */}
            <div className="w-1/2 bg-[#fbf9f4] p-10 flex flex-col justify-between">
                <div>
                    <h3 className="text-2xl font-black text-primary tracking-tight mb-2">Payment Setup</h3>
                    <p className="text-on-surface-variant font-medium mb-8">Enter amount tendered or select exact amount</p>
                    
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-outline-variant/10 text-center mb-8">
                        <span className="block text-sm text-on-surface-variant font-bold uppercase tracking-wider mb-2">Amount Due</span>
                        <span className="text-5xl font-black text-[#14341d] font-headline">₱{total.toFixed(2)}</span>
                    </div>

                    {/* Fake Keypad Display */}
                    <div className="relative mb-4 group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-primary font-black text-2xl">₱</div>
                        <input 
                            readOnly
                            value={amountTendered}
                            className={`w-full text-right text-4xl font-black bg-white rounded-2xl py-4 pr-6 pl-12 border-2 outline-none transition-colors ${isInsufficient && amountTendered !== "" ? 'border-error text-error' : 'border-primary/20 focus:border-primary text-primary'}`}
                        />
                    </div>
                    
                    {/* Change Display */}
                    <div className="flex justify-between items-center px-4 py-3 bg-surface-container-highest rounded-xl">
                      <span className="font-bold text-on-surface-variant">Change</span>
                      {amountTendered === "" ? (
                        <span className="font-bold text-on-surface-variant">₱0.00</span>
                      ) : isInsufficient ? (
                        <span className="font-bold text-error flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">warning</span> Insufficient</span>
                      ) : (
                        <span className="font-black text-primary text-xl">₱{change.toFixed(2)}</span>
                      )}
                    </div>
                </div>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-3 mb-6 mt-6">
                    <button className="col-span-1 rounded-xl bg-surface-container py-3 font-bold text-primary hover:bg-primary/10 transition-colors" onClick={() => handleQuickAmount(total)}>
                        Exact
                    </button>
                    {QUICK_AMOUNTS.map(amt => (
                        <button key={amt} className="col-span-1 rounded-xl bg-surface-container py-3 font-bold text-primary hover:bg-primary/10 transition-colors" onClick={() => handleQuickAmount(amt)}>
                            ₱{amt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Right side: Numpad & Actions */}
            <div className="w-1/2 p-10 flex flex-col bg-white">
                <div className="grid grid-cols-3 gap-4 flex-1">
                    {['1','2','3','4','5','6','7','8','9','00','0','.'].map((num) => (
                        <button 
                            key={num} 
                            onClick={() => handleKeypad(num)}
                            className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl text-2xl font-black text-[#14341d] active:scale-95 transition-all outline-none hover:bg-surface-container-low shadow-sm"
                        >
                            {num}
                        </button>
                    ))}
                </div>
                
                <div className="flex gap-4 mt-8">
                    <button 
                        onClick={() => handleKeypad('DEL')} 
                        className="w-20 h-20 shrink-0 bg-surface-container-highest rounded-2xl flex items-center justify-center text-on-surface-variant hover:bg-error-container hover:text-error transition-colors active:scale-95"
                    >
                        <span className="material-symbols-outlined text-3xl">backspace</span>
                    </button>
                    <button 
                        onClick={() => handleKeypad('C')} 
                        className="w-20 h-20 shrink-0 bg-surface-container-highest rounded-2xl flex items-center justify-center font-black text-xl text-on-surface-variant hover:bg-surface transition-colors active:scale-95"
                    >
                        C
                    </button>
                    <button 
                        onClick={completeCheckout}
                        disabled={checkingOut || isInsufficient || amountTendered === ""}
                        className="flex-1 bg-primary text-white rounded-2xl font-black text-2xl flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20 disabled:scale-100 disabled:opacity-50"
                    >
                        {checkingOut ? (
                            <span className="material-symbols-outlined animate-spin text-4xl">progress_activity</span>
                        ) : 'Confirm Pay'}
                    </button>
                </div>
                
                {/* Cancel link */}
                <button 
                    onClick={() => setShowPayModal(false)}
                    className="mt-6 text-center text-on-surface-variant font-bold hover:text-primary transition-colors py-2"
                >
                    Cancel Transaction
                </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt Success Modal ──────────────────────────────────────────────────────── */}
      {receipt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-300 print:hidden">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-sm p-10 text-center animate-in zoom-in-95 duration-500 delay-100">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center mx-auto mb-6 shadow-xl shadow-primary/30 relative">
              <span className="material-symbols-outlined text-white text-5xl">check</span>
              <div className="absolute top-0 -right-2 text-primary animate-pulse text-xl">✨</div>
              <div className="absolute -bottom-2 -left-2 text-primary animate-pulse text-lg">✨</div>
            </div>
            <h3 className="text-3xl font-black text-[#14341d] tracking-tight mb-2">Order Success!</h3>
            <p className="text-on-surface-variant font-medium mb-1">Receipt ID</p>
            <p className="font-mono text-primary font-bold text-sm bg-primary-container/30 py-2 px-4 rounded-xl break-all mb-6 border border-primary/10 inline-block">{receipt.id}</p>
            
            <div className="bg-surface-container-highest rounded-2xl p-4 mb-6 text-left">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-on-surface-variant">Amount Due:</span>
                <span className="text-sm font-bold">₱{receipt.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-on-surface-variant">Tendered:</span>
                <span className="text-sm font-bold">₱{receipt.amountTendered.toFixed(2)}</span>
              </div>
              <div className="w-full border-t border-dashed border-outline-variant/30 my-2" />
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-primary">Change:</span>
                <span className="text-lg font-black text-primary">₱{receipt.change.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.print()}
                className="w-full py-4 bg-surface-container text-[#14341d] rounded-2xl font-bold text-lg hover:bg-surface-container-high transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined">print</span>
                Print Receipt
              </button>
              <button
                id="btn-receipt-close"
                onClick={() => setReceipt(null)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black text-lg hover:opacity-90 shadow-lg shadow-primary/20 transition-all duration-300 active:scale-[0.98]"
              >
                Start New Order
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Hidden Print-Only Thermal Receipt Style ──────────────────────────────────────────────────────── */}
      {receipt && (
        <div className="hidden print:block absolute top-0 left-0 w-full min-h-screen bg-white z-[999] text-black bg-white">
           <div className="w-[320px] mx-auto pt-8 font-mono text-sm pb-20">
              <div className="text-center mb-6">
                 <h1 className="text-2xl font-bold font-headline uppercase tracking-widest break-all">MARIMONO MATCHA</h1>
                 <p className="text-xs uppercase mt-1">123 Ceremonial Way</p>
                 <p className="text-xs uppercase">info@marimono.matcha</p>
              </div>

              <div className="mb-4">
                 <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{receipt.date}</span>
                 </div>
                 <div className="flex justify-between">
                    <span>Receipt:</span>
                    <span className="uppercase">{receipt.id.split('-')[0]}</span>
                 </div>
                 {receipt.customerName && (
                   <div className="flex justify-between">
                      <span>Customer:</span>
                      <span>{receipt.customerName}</span>
                   </div>
                 )}
              </div>

              <div className="border-b-2 border-dashed border-black/30 my-3 w-full" />
              
              <div className="mb-4 space-y-3">
                 {receipt.items.map((item, idx) => {
                    const itemTotal = (item.price + (item.addOns?.reduce((s, a) => s + a.price, 0) || 0)) * item.qty;
                    return (
                      <div key={idx} className="flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 font-bold">
                              {item.qty}x {item.name}
                          </div>
                          <div className="shrink-0 font-bold">
                              ₱{itemTotal.toFixed(2)}
                          </div>
                        </div>
                        {item.addOns && item.addOns.length > 0 && (
                          <div className="pl-6 space-y-0.5 text-xs">
                            {item.addOns.map((a, i) => (
                              <div key={i} className="flex justify-between">
                                <span>+ {a.name}</span>
                                <span>(₱{a.price.toFixed(2)})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                 })}
              </div>

              <div className="border-b-2 border-dashed border-black/30 my-3 w-full" />
              
              <div className="flex justify-between font-black text-xl my-2">
                 <span>TOTAL</span>
                 <span>₱{receipt.total.toFixed(2)}</span>
              </div>

              <div className="border-b border-solid border-black my-2 w-full" />
              
              <div className="space-y-1 my-2">
                 <div className="flex justify-between">
                    <span>CASH TENDERED</span>
                    <span>₱{receipt.amountTendered.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between font-bold">
                    <span>CHANGE DUE</span>
                    <span>₱{receipt.change.toFixed(2)}</span>
                 </div>
              </div>

              <div className="border-b border-solid border-black my-2 w-full" />

              <div className="text-center mt-8 text-xs font-bold space-y-1">
                 <p>THANK YOU FOR YOUR VISIT</p>
                 <p>marimonomatcha.com</p>
                 <p className="mt-4 opacity-50 text-[10px]">Powered by Ritual POS</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
