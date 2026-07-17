"use client";

import { useEffect, useMemo, useState } from "react";
import { TopBar } from "@/components/topbar";
import { StatusBadge } from "@/components/status-badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api";
import type { Driver, DriverStatus } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { driverSchema } from "@/lib/validations";
import type { z } from "zod";
import { ArrowUp, ArrowDown } from "lucide-react";

type DriverForm = z.infer<typeof driverSchema>;

const emptyForm: DriverForm = {
  name: "",
  licenseNo: "",
  category: "",
  licenseExpiry: "",
  contact: "",
};

const STATUSES: DriverStatus[] = ["Available", "On Trip", "Off Duty", "Suspended"];

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [sortBy, setSortBy] = useState("");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: emptyForm,
  });

  function fetchDrivers() {
    setPage(1);
    setLoading(true);
    setError(null);
    apiFetch<Driver[]>("/drivers", {
      params: {
        search: search || undefined,
        sort_by: sortBy || undefined,
        sort_order: sortOrder,
      },
    })
      .then(setDrivers)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load drivers"))
      .finally(() => setLoading(false));
  }

  useEffect(fetchDrivers, [search, sortBy, sortOrder]);

  function handleSort(column: string) {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
  }

  function SortIcon({ column }: { column: string }) {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />;
  }

  const statusCounts = useMemo(() => {
    const counts: Record<DriverStatus, number> = {
      Available: 0,
      "On Trip": 0,
      "Off Duty": 0,
      Suspended: 0,
    };
    drivers.forEach((d) => {
      counts[d.status] = (counts[d.status] ?? 0) + 1;
    });
    return counts;
  }, [drivers]);

  async function onAddDriver(data: DriverForm) {
    try {
      await apiFetch("/drivers", { method: "POST", body: JSON.stringify(data) });
      reset(emptyForm);
      setDialogOpen(false);
      fetchDrivers();
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not add driver" });
    }
  }

  return (
    <div>
      <TopBar onSearch={setSearch} searchPlaceholder="Search drivers..." />

      <div className="p-6 space-y-4">
        <div className="flex justify-end">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              + Add Driver
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Driver</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddDriver)} className="space-y-3">
                {errors.root && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                    {errors.root.message}
                  </div>
                )}
                <div className="space-y-1">
                  <Input placeholder="Full name" {...register("name")} />
                  {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input placeholder="License No." {...register("licenseNo")} />
                  {errors.licenseNo && <p className="text-xs text-red-500">{errors.licenseNo.message}</p>}
                </div>
                <div className="space-y-1">
                  <Select value={watch("category")} onValueChange={(v) => setValue("category", v ?? "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LMV">LMV</SelectItem>
                      <SelectItem value="HMV">HMV</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-xs text-red-500">{errors.category.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input type="date" placeholder="License Expiry" {...register("licenseExpiry")} />
                  {errors.licenseExpiry && <p className="text-xs text-red-500">{errors.licenseExpiry.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input placeholder="Contact" {...register("contact")} />
                  {errors.contact && <p className="text-xs text-red-500">{errors.contact.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Driver"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* Desktop table */}
        <div className="hidden rounded-md border border-border bg-card md:block">
          <Table>
              <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer select-none" role="button" tabIndex={0} onClick={() => handleSort("name")} onKeyDown={(e) => e.key === "Enter" && handleSort("name")}>
                  Driver <SortIcon column="name" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" role="button" tabIndex={0} onClick={() => handleSort("licenseNo")} onKeyDown={(e) => e.key === "Enter" && handleSort("licenseNo")}>
                  License No. <SortIcon column="licenseNo" />
                </TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="cursor-pointer select-none" role="button" tabIndex={0} onClick={() => handleSort("licenseExpiry")} onKeyDown={(e) => e.key === "Enter" && handleSort("licenseExpiry")}>
                  Expiry <SortIcon column="licenseExpiry" />
                </TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Trip Compl.</TableHead>
                <TableHead className="cursor-pointer select-none" role="button" tabIndex={0} onClick={() => handleSort("safetyScore")} onKeyDown={(e) => e.key === "Enter" && handleSort("safetyScore")}>
                  Safety <SortIcon column="safetyScore" />
                </TableHead>
                <TableHead className="cursor-pointer select-none" role="button" tabIndex={0} onClick={() => handleSort("status")} onKeyDown={(e) => e.key === "Enter" && handleSort("status")}>
                  Status <SortIcon column="status" />
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8}>
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : drivers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    No drivers found
                  </TableCell>
                </TableRow>
              ) : (
                drivers.slice((page - 1) * pageSize, page * pageSize).map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>{d.name}</TableCell>
                    <TableCell className="font-mono text-xs">{d.licenseNo}</TableCell>
                    <TableCell>{d.category}</TableCell>
                    <TableCell>{d.licenseExpiry}</TableCell>
                    <TableCell>{d.contact}</TableCell>
                    <TableCell>{d.tripCompletionPct}%</TableCell>
                    <TableCell>{d.safetyScorePct}%</TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-md border border-border bg-card" />
            ))
          ) : drivers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No drivers found</p>
          ) : (
            drivers.slice((page - 1) * pageSize, page * pageSize).map((d) => (
              <div key={d.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{d.name}</span>
                  <StatusBadge status={d.status} />
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span className="font-mono">{d.licenseNo}</span>
                  <span>{d.category}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Exp: {d.licenseExpiry}</span>
                  <span>{d.contact}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                  <span>Safety: {d.safetyScorePct}%</span>
                  <span>Trips: {d.tripCompletionPct}%</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Status totals strip */}
        <div className="flex flex-wrap items-center gap-2">
          {STATUSES.map((s) => (
            <div key={s} className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5">
              <StatusBadge status={s} />
              <span className="text-sm text-foreground">{statusCounts[s]}</span>
            </div>
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(drivers.length / pageSize))}
          onPageChange={setPage}
        />

        <p className="text-xs text-muted-foreground">
          Rule: expired license or suspended status blocks trip assignment.
        </p>
      </div>
    </div>
  );
}
