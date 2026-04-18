"use client";

import React, { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { supabase } from "./supabaseClient";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  stock?: number;
  image?: string;
  sku?: string;
};

export type OrderItem = { name: string; qty: number; price: number };
export type Order = {
  id: string;
  customer: string;
  date: string;
  total: number;
  status: "Pending" | "Processing" | "Completed" | "Cancelled";
  items: OrderItem[];
};

type CartItem = { product: Product; quantity: number };

type State = {
  products: Product[];
  orders: Order[];
  cart: CartItem[];
  loading: boolean;
};

type Action =
  | { type: "SET_PRODUCTS"; payload: Product[] }
  | { type: "SET_ORDERS"; payload: Order[] }
  | { type: "ADD_TO_CART"; payload: Product }
  | { type: "SET_CART"; payload: CartItem[] }
  | { type: "UPDATE_CART_QTY"; payload: { id: string; quantity: number } }
  | { type: "REMOVE_FROM_CART"; payload: string }
  | { type: "CLEAR_CART" }
  | { type: "SET_LOADING"; payload: boolean };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dispatch = (action: Action | ((dispatch: Dispatch, getState: () => State) => void)) => void;

// ─── Reducer ──────────────────────────────────────────────────────────────────

const initialState: State = { products: [], orders: [], cart: [], loading: false };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_PRODUCTS":
      return { ...state, products: action.payload };
    case "SET_ORDERS":
      return { ...state, orders: action.payload };
    case "ADD_TO_CART": {
      const p = action.payload;
      const existing = state.cart.find((c) => c.product.id === p.id);
      if (existing) {
        return {
          ...state,
          cart: state.cart.map((c) =>
            c.product.id === p.id ? { ...c, quantity: c.quantity + 1 } : c
          ),
        };
      }
      return { ...state, cart: [...state.cart, { product: p, quantity: 1 }] };
    }
    case "SET_CART":
      return { ...state, cart: action.payload };
    case "UPDATE_CART_QTY": {
      const { id, quantity } = action.payload;
      const next = state.cart.map((ci) => (ci.product.id === id ? { ...ci, quantity } : ci));
      return { ...state, cart: next.filter((ci) => ci.quantity > 0) };
    }
    case "REMOVE_FROM_CART":
      return { ...state, cart: state.cart.filter((ci) => ci.product.id !== action.payload) };
    case "CLEAR_CART":
      return { ...state, cart: [] };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ─── Context ──────────────────────────────────────────────────────────────────

const StoreContext = createContext<{ state: State; dispatch: Dispatch } | undefined>(undefined);

export const StoreProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, baseDispatch] = useReducer(reducer, initialState);

  const dispatch: Dispatch = (action) => {
    if (typeof action === "function") {
      action(dispatch, () => state);
      return;
    }
    baseDispatch(action);
  };

  // ── Supabase Realtime v2 subscriptions ──────────────────────────────────────
  useEffect(() => {
    // Initial fetch
    dispatch(fetchProducts());
    dispatch(fetchOrders());

    // Subscribe to realtime changes
    const channel = supabase
      .channel("db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "products" },
        () => { dispatch(fetchProducts()); }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => { dispatch(fetchOrders()); }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

// ─── Thunks ───────────────────────────────────────────────────────────────────

export const fetchProducts =
  () => async (dispatch: Dispatch) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data, error } = await supabase.from("products").select("*").order("name");
    if (!error && data) dispatch({ type: "SET_PRODUCTS", payload: data as Product[] });
    dispatch({ type: "SET_LOADING", payload: false });
  };

export const fetchOrders =
  () => async (dispatch: Dispatch) => {
    dispatch({ type: "SET_LOADING", payload: true });
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("date", { ascending: false });
    if (!error && data) dispatch({ type: "SET_ORDERS", payload: data as Order[] });
    dispatch({ type: "SET_LOADING", payload: false });
  };
