"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
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
      {/* Background accent */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-container/50 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-white text-3xl">eco</span>
          </div>
          <h1 className="text-2xl font-black text-primary font-headline tracking-tight">
            MARIMONO
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">Administrative Access Portal</p>
        </div>

        {/* Card */}
        <div className="bg-surface-container-lowest rounded-2xl p-8 shadow-lg border border-outline-variant/10">
          <div className="w-full h-1 bg-gradient-to-r from-primary via-primary-container to-primary rounded-full mb-6" />

          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary ml-1" htmlFor="login-email">
                Email
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  person
                </span>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-1 focus:ring-primary text-on-surface outline-none transition-all"
                  placeholder="admin@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-primary ml-1" htmlFor="login-password">
                Password
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">
                  lock
                </span>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-4 py-3 bg-surface-container-high border-none rounded-lg focus:ring-1 focus:ring-primary text-on-surface outline-none transition-all"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-error-container text-on-error-container rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            <button
              id="btn-login"
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center gap-2 py-4 px-6 rounded-xl bg-primary text-on-primary font-bold text-base shadow-md hover:opacity-90 active:scale-[0.98] transition-all duration-150 disabled:opacity-60"
            >
              {loading ? (
                <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
              ) : (
                <>
                  Sign In
                  <span className="material-symbols-outlined text-xl">arrow_forward</span>
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-on-surface-variant mt-6">
          Powered by Marimono OS — v2.5.0
        </p>
      </div>
    </div>
  );
}
