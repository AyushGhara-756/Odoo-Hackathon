"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/topbar";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { DashboardSummary, Trip, VehicleStatus } from "@/lib/types";

const VEHICLE_STATUSES: VehicleStatus[] = ["Available", "On Trip", "In Shop", "Retired"];

export default function DashboardPage() {
  const [vehicleType, setVehicleType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentTrips, setRecentTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([
      apiFetch<string[]>("/vehicles/types").catch(() => []),
      apiFetch<string[]>("/regions").catch(() => []),
    ]).then(([types, regs]) => {
      setVehicleTypes(types);
      setRegions(regs);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiFetch<DashboardSummary>("/dashboard/summary", {
        params: { vehicleType: vehicleType || undefined, status: status || undefined, region: region || undefined },
      }),
      apiFetch<Trip[]>("/trips/recent"),
    ])
      .then(([summaryData, tripsData]) => {
        if (cancelled) return;
        setSummary(summaryData);
        setRecentTrips(tripsData);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [vehicleType, status, region]);

  const statCards = summary
    ? [
        { label: "Active Vehicles", value: summary.activeVehicles },
        { label: "Available Vehicles", value: summary.availableVehicles },
        { label: "Vehicles in Maintenance", value: summary.vehiclesInMaintenance },
        { label: "Active Trips", value: summary.activeTrips },
        { label: "Pending Trips", value: summary.pendingTrips },
        { label: "Drivers on Duty", value: summary.driversOnDuty },
        { label: "Fleet Utilization", value: `${summary.fleetUtilizationPct}%` },
      ]
    : [];

  const maxStatusCount = summary
    ? Math.max(...Object.values(summary.vehicleStatusBreakdown), 1)
    : 1;

  return (
    <div>
      <TopBar onSearch={() => {}} searchPlaceholder="Search dashboard..." />

      <div className="p-6 space-y-6">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <Select value={vehicleType} onValueChange={(v) => setVehicleType(v ?? "")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Vehicle Type: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {vehicleTypes.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Status: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {VEHICLE_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={region} onValueChange={(v) => setRegion(v ?? "")}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Region: All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All</SelectItem>
              {regions.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
          {loading
            ? Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-card" />
              ))
            : statCards.map((card) => (
                <div key={card.label} className="rounded-md border border-border bg-card p-4">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{card.value}</p>
                </div>
              ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent trips */}
          <div className="lg:col-span-2 rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Recent Trips</h3>
            </div>
            {/* Desktop table */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Trip</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ETA</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : recentTrips.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No recent trips
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentTrips.map((trip) => (
                      <TableRow key={trip.id}>
                        <TableCell>{trip.id}</TableCell>
                        <TableCell>{trip.vehicleName ?? "--"}</TableCell>
                        <TableCell>{trip.driverName ?? "--"}</TableCell>
                        <TableCell>
                          <StatusBadge status={trip.status} />
                        </TableCell>
                        <TableCell>{trip.eta ?? trip.note ?? "--"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {/* Mobile cards */}
            <div className="space-y-2 p-4 md:hidden">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-card" />
                ))
              ) : recentTrips.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">No recent trips</p>
              ) : (
                recentTrips.map((trip) => (
                  <div key={trip.id} className="rounded-md border border-border bg-card p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{trip.id}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      <span>{trip.vehicleName ?? "--"}</span>
                      <span>{trip.driverName ?? "--"}</span>
                      <span>{trip.eta ?? trip.note ?? "--"}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Vehicle status breakdown */}
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="mb-3 text-sm font-medium text-foreground">Vehicle Status</h3>
            {loading || !summary ? (
              <div className="h-24 animate-pulse rounded-md bg-muted" />
            ) : (
              <div className="space-y-3">
                {VEHICLE_STATUSES.map((s) => {
                  const count = summary.vehicleStatusBreakdown[s] ?? 0;
                  return (
                    <div key={s} className="flex items-center gap-3">
                      <span className="w-16 text-xs text-muted-foreground">{s}</span>
                      <div className="h-2 flex-1 rounded-full bg-muted">
                        <div
                          className="h-2 rounded-full bg-orange-500"
                          style={{ width: `${(count / maxStatusCount) * 100}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-xs text-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
