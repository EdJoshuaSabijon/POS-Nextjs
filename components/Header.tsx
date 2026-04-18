"use client";

import { usePathname } from "next/navigation";

const TITLES: Record<string, string> = {
  "/dashboard": "Executive Overview",
  "/pos": "Point of Sale",
  "/products": "Inventory Management",
  "/orders": "Order Management",
};

export default function Header() {
  const pathname = usePathname();
  const title =
    pathname ? Object.entries(TITLES).find(([key]) => pathname === key || pathname.startsWith(key + "/"))?.[1] ?? "Marimono Matcha" : "Marimono Matcha";

  return (
    <header className="flex justify-between items-center h-16 px-8 sticky top-0 z-40 bg-[#fbf9f4]/90 backdrop-blur-md shadow-sm border-b border-outline-variant/10 print:hidden">
      <div className="flex items-center gap-6">
        <span className="text-lg font-black text-[#14341d] uppercase tracking-widest font-manrope hidden lg:block">
          {title}
        </span>
      </div>
    </header>
  );
}
