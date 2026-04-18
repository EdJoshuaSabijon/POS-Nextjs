"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginForm() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const router = useRouter();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (email === "admin@example.com" && password === "admin123") {
      document.cookie = `admin=true; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
      return;
    }
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    if (data.session) {
      document.cookie = `admin=true; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
    } else {
      setError("Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest rounded-xl p-8 shadow-sm relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-primary-container to-primary" />

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-primary ml-1" htmlFor="lf-email">
            Email
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              person
            </span>
            <input
              id="lf-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
              className="block w-full pl-11 pr-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-primary ml-1" htmlFor="lf-password">
            Password
          </label>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
              lock
            </span>
            <input
              id="lf-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="block w-full pl-11 pr-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm">
            {error}
          </div>
        )}

        <button
          id="btn-loginform-submit"
          type="submit"
          disabled={loading}
          className="w-full flex justify-center items-center gap-2 py-4 px-6 rounded-xl bg-primary text-on-primary font-bold text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
        >
          {loading ? (
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
          ) : (
            <>
              Sign In
              <span className="material-symbols-outlined text-xl">arrow_forward</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
