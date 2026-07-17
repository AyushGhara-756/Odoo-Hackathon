"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/topbar";
import { StatusBadge } from "@/components/status-badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { Pagination } from "@/components/Pagination";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import type { MaintenanceRecord, Vehicle } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { maintenanceSchema } from "@/lib/validations";

interface MaintenanceForm {
  vehicleId: string;
  serviceType: string;
  cost: string;
  date: string;
  status: string;
}

const emptyForm: MaintenanceForm = {
  vehicleId: "",
  serviceType: "",
  cost: "",
  date: "",
  status: "In Shop",
};

export default function MaintenancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const pageSize = 10;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<MaintenanceForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(maintenanceSchema) as any,
    defaultValues: emptyForm,
  });

  function fetchRecords() {
    setLoading(true);
    setError(null);
    apiFetch<MaintenanceRecord[]>("/maintenance", { params: { search: search || undefined } })
      .then(setRecords)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load maintenance log"))
      .finally(() => setLoading(false));
  }

  useEffect(fetchRecords, [search]);

  useEffect(() => {
    apiFetch<Vehicle[]>("/vehicles").then(setVehicles).catch(() => {});
    apiFetch<string[]>("/maintenance/service-types")
      .then(setServiceTypes)
      .catch(() => setServiceTypes(["Oil Change", "Engine Repair", "Tyre Replace"]));
  }, []);

  async function onSave(data: MaintenanceForm) {
    try {
      await apiFetch("/maintenance", {
        method: "POST",
        body: JSON.stringify({ ...data, cost: Number(data.cost) }),
      });
      reset(emptyForm);
      fetchRecords();
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not save service record" });
    }
  }

  async function handleCloseMaintenance(recordId: string) {
    try {
      await apiFetch(`/maintenance/${recordId}/close`, { method: "PATCH" });
      fetchRecords();
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not close maintenance" });
    }
  }

  return (
    <div>
      <TopBar onSearch={setSearch} searchPlaceholder="Search maintenance..." />

      <div className="p-6 grid gap-6 lg:grid-cols-2">
        {/* Log service record form */}
        <div className="rounded-md border border-border bg-card p-4">
          <button
            onClick={() => setShowForm((prev) => !prev)}
            className="mb-4 flex w-full items-center justify-between text-sm font-medium text-foreground md:cursor-default md:pointer-events-none"
          >
            <span>Log Service Record</span>
            <span className="text-xs text-muted-foreground md:hidden">
              {showForm ? "Hide" : "Show"}
            </span>
          </button>
          <div className={showForm ? "block" : "hidden md:block"}>
          <form onSubmit={handleSubmit(onSave)} className="space-y-3">
            {errors.root && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                {errors.root.message}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Vehicle</label>
              <Select value={watch("vehicleId")} onValueChange={(v) => setValue("vehicleId", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select vehicle" />
                </SelectTrigger>
                <SelectContent>
                  {vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.regNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.vehicleId && <p className="text-xs text-red-500">{errors.vehicleId.message}</p>}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Service Type</label>
              <Input
                placeholder="Type service type..."
                list="service-types-list"
                {...register("serviceType")}
              />
              <datalist id="service-types-list">
                {serviceTypes.map((st) => (
                  <option key={st} value={st} />
                ))}
              </datalist>
              {errors.serviceType && <p className="text-xs text-red-500">{errors.serviceType.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Cost</label>
                <Input type="number" {...register("cost")} />
                {errors.cost && <p className="text-xs text-red-500">{errors.cost.message}</p>}
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Date</label>
                <Input type="date" {...register("date")} />
                {errors.date && <p className="text-xs text-red-500">{errors.date.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Status</label>
              <Select value={watch("status")} onValueChange={(v) => setValue("status", v ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="In Shop">In Shop</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && <p className="text-xs text-red-500">{errors.status.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </form>
            </div>

          <div className="mt-6 text-xs text-muted-foreground space-y-1">
            <p>Available ⇄ In Shop</p>
            <p>Rule: In Shop vehicles are removed from the dispatch pool.</p>
          </div>
        </div>

        {/* Service log table (desktop) */}
        <div className="hidden rounded-md border border-border bg-card md:block">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">Service Log</h3>
          </div>
          {error && (
            <div className="m-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : records.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No service records
                  </TableCell>
                </TableRow>
              ) : (
                records.slice((page - 1) * pageSize, page * pageSize).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{r.vehicleName}</TableCell>
                    <TableCell>{r.serviceType}</TableCell>
                    <TableCell>₹{r.cost.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>
                      {r.status === "In Shop" || r.status === "Scheduled" ? (
                        <Button size="sm" variant="outline" onClick={() => handleCloseMaintenance(r.id)}>
                          Close
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(records.length / pageSize))}
            onPageChange={setPage}
          />
        </div>

        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          <h3 className="text-sm font-medium text-foreground">Service Log</h3>
          {error && (
            <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
              {error}
            </div>
          )}
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-md border border-border bg-card" />
            ))
          ) : records.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No service records</p>
          ) : (
            records.slice((page - 1) * pageSize, page * pageSize).map((r) => (
              <div key={r.id} className="rounded-md border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{r.vehicleName}</span>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.serviceType}</p>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">₹{r.cost.toLocaleString()}</span>
                  {(r.status === "In Shop" || r.status === "Scheduled") && (
                    <Button size="sm" variant="outline" onClick={() => handleCloseMaintenance(r.id)}>
                      Close
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
          <Pagination
            currentPage={page}
            totalPages={Math.max(1, Math.ceil(records.length / pageSize))}
            onPageChange={setPage}
          />
        </div>


      </div>
    </div>
  );
}
