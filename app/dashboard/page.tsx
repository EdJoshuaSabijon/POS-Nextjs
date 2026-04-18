import StatCards from "@/components/dashboard/StatCards";
import SalesTrendsChart from "@/components/dashboard/SalesTrendsChart";
import BestSellingList from "@/components/dashboard/BestSellingList";
import SecondaryInsights from "@/components/dashboard/SecondaryInsights";
import DashboardHeaderControls from "@/components/dashboard/DashboardHeaderControls";

export const metadata = {
  title: "Dashboard | The Ritual",
  description: "Real-time analytics dashboard for Ritual Matcha Bar",
};

export default function DashboardPage() {
  return (
    <div className="p-8 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-primary tracking-tight font-headline">
            Executive Overview
          </h2>
          <p className="text-on-surface-variant mt-1">
            Real-time performance tracking for Ritual Matcha Bar
          </p>
        </div>
        <DashboardHeaderControls />
      </div>

      <StatCards />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <SalesTrendsChart />
        <BestSellingList />
      </div>

      <SecondaryInsights />
    </div>
  );
}
