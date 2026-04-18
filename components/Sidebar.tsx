"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard", icon: "dashboard" },
  { label: "POS", href: "/pos", icon: "point_of_sale" },
  { label: "Products", href: "/products", icon: "eco" },
  { label: "Orders", href: "/orders", icon: "receipt_long" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    document.cookie = "admin=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push("/login");
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 bg-[#f0eee9] flex flex-col py-8 z-50 print:hidden">
      {/* Brand */}
      <div className="px-6 mb-10">
        <h1 className="text-xl font-bold text-[#14341d] tracking-tight font-manrope">
          Marimono
        </h1>
        <p className="text-sm text-on-surface-variant font-medium opacity-70">Specialty Matcha</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 pr-4" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname ? pathname === item.href || pathname.startsWith(item.href + "/") : false;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "flex items-center gap-3 px-4 py-3 bg-[#fbf9f4] text-[#14341d] rounded-r-full font-bold active:scale-95 transition-all duration-150 shadow-sm"
                  : "flex items-center gap-3 px-4 py-3 text-[#43483f] hover:text-[#14341d] hover:bg-[#e4e2dd] transition-colors rounded-r-full"
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="font-manrope tracking-tight font-semibold">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 mt-auto space-y-4">
        <Link
          href="/orders"
          className="w-full inline-flex items-center justify-center bg-primary-container text-on-primary-container py-3 rounded-xl font-bold gap-2 hover:opacity-90 transition-all active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          New Order
        </Link>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
            A
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary truncate">Admin</p>
            <p className="text-xs text-on-surface-variant">Store Manager</p>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign out"
            className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors text-[20px]"
          >
            logout
          </button>
        </div>
      </div>
    </aside>
  );
}
