import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar />
      <div className="flex flex-col flex-1 ml-64">
        <Header />
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
