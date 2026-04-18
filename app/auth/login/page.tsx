"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AuthLoginPage() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.session) {
      document.cookie = `admin=true; path=/; max-age=86400; SameSite=Lax`;
      router.push("/dashboard");
    } else {
      setError("Authentication failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="w-full max-w-md px-6">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">eco</span>
          </div>
          <h1 className="text-2xl font-black text-primary font-headline">THE RITUAL</h1>
          <p className="text-sm text-on-surface-variant mt-1">Admin Sign In</p>
        </div>

        <form onSubmit={onSubmit} className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg border border-outline-variant/10 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-primary mb-1" htmlFor="auth-email">Email</label>
            <input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-primary mb-1" htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-high rounded-lg outline-none focus:ring-1 focus:ring-primary"
              required
            />
          </div>
          {error && <p className="text-sm text-error">{error}</p>}
          <button
            id="btn-auth-login"
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary text-on-primary rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
