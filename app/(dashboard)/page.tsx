import StatCards from "@/components/dashboard/StatCards";
import SalesTrendsChart from "@/components/dashboard/SalesTrendsChart";
import BestSellingList from "@/components/dashboard/BestSellingList";
import SecondaryInsights from "@/components/dashboard/SecondaryInsights";

export const metadata = {
  title: "Dashboard | The Ritual",
  description: "Real-time analytics dashboard for Ritual Matcha Bar",
};

export default function DashboardPage() {
  return (
    <div className="p-8 min-h-[calc(100vh-64px)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
            Executive Overview
          </h2>
          <p className="text-on-surface-variant mt-1">
            Real-time performance tracking for Ritual Matcha Bar
          </p>
        </div>
        <div className="flex gap-3">
          <button
            id="btn-date-filter"
            className="px-4 py-2 bg-surface-container-highest text-primary font-semibold rounded-xl text-sm flex items-center gap-2 hover:bg-surface-dim transition-colors"
          >
            <span className="material-symbols-outlined text-sm">calendar_today</span>
            Last 7 Days
          </button>
          <button
            id="btn-export-pdf"
            className="px-4 py-2 bg-primary text-white font-semibold rounded-xl text-sm flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <StatCards />

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SalesTrendsChart />
        <BestSellingList />
      </div>

      {/* Secondary */}
      <SecondaryInsights />
    </div>
  );
}
