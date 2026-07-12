"use client";

import { useEffect, useState, useCallback } from "react";
import { TopBar } from "@/components/topbar";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { apiFetch } from "@/lib/api";
import type { AnalyticsKPIs, CostliestVehicle, MonthlyRevenuePoint } from "@/lib/types";
import { Download } from "lucide-react";

export default function AnalyticsPage() {
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenuePoint[]>([]);
  const [topCostliest, setTopCostliest] = useState<CostliestVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<AnalyticsKPIs>("/analytics/kpis"),
      apiFetch<MonthlyRevenuePoint[]>("/analytics/monthly-revenue"),
      apiFetch<CostliestVehicle[]>("/analytics/top-costliest-vehicles"),
    ])
      .then(([k, mr, tc]) => {
        setKpis(k);
        setMonthlyRevenue(mr);
        setTopCostliest(tc);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  const maxCost = Math.max(...topCostliest.map((v) => v.cost), 1);

  const handleExportCSV = useCallback(() => {
    const rows = [
      ["Metric", "Value"],
      ["Fuel Efficiency (km/l)", kpis?.fuelEfficiencyKmPerL ?? ""],
      ["Fleet Utilization (%)", kpis?.fleetUtilizationPct ?? ""],
      ["Operational Cost", kpis?.operationalCost ?? ""],
      ["Vehicle ROI (%)", kpis?.vehicleRoiPct ?? ""],
      [],
      ["Month", "Revenue"],
      ...monthlyRevenue.map((m) => [m.month, m.revenue]),
      [],
      ["Vehicle", "Cost"],
      ...topCostliest.map((v) => [v.vehicleName, v.cost]),
    ];

    const csv = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transitops-analytics.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [kpis, monthlyRevenue, topCostliest]);

  return (
    <div>
      <TopBar searchPlaceholder="Search analytics..." />

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={handleExportCSV} disabled={loading || !kpis}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {loading || !kpis ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-card" />
            ))
          ) : (
            <>
              <div className="rounded-md border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Fuel Efficiency</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {kpis.fuelEfficiencyKmPerL} km/l
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Fleet Utilization</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  {kpis.fleetUtilizationPct}%
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Operational Cost</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">
                  ₹{kpis.operationalCost.toLocaleString()}
                </p>
              </div>
              <div className="rounded-md border border-border bg-card p-4">
                <p className="text-xs text-muted-foreground">Vehicle ROI</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{kpis.vehicleRoiPct}%</p>
              </div>
            </>
          )}
        </div>

        <p className="text-xs text-muted-foreground">
          ROI = Revenue - (Maintenance + Fuel) / Acquisition Cost
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Monthly revenue chart */}
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">Monthly Revenue</h3>
            {loading ? (
              <div className="h-48 animate-pulse rounded-md bg-muted" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyRevenue}>
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                    }}
                  />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top costliest vehicles */}
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">Top Costliest Vehicles</h3>
            {loading ? (
              <div className="h-48 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="space-y-3">
                {topCostliest.map((v) => (
                  <div key={v.vehicleName} className="flex items-center gap-3">
                    <span className="w-16 text-xs text-muted-foreground">{v.vehicleName}</span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-red-500"
                        style={{ width: `${(v.cost / maxCost) * 100}%` }}
                      />
                    </div>
                    <span className="w-16 text-right text-xs text-foreground">
                      ₹{v.cost.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
