"use client";

import { useEffect, useState } from "react";
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
import type { Vehicle } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { vehicleSchema } from "@/lib/validations";

interface VehicleForm {
  regNo: string;
  makeModel: string;
  type: string;
  capacityKg: string;
  odometer: string;
  avgCost: string;
}

const emptyForm: VehicleForm = {
  regNo: "",
  makeModel: "",
  type: "",
  capacityKg: "",
  odometer: "",
  avgCost: "",
};

const VEHICLE_TYPES = ["Van", "Truck", "Mini"];
const VEHICLE_STATUSES = ["Available", "On Trip", "In Shop", "Retired"];

export default function FleetPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vehicleTypes, setVehicleTypes] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<VehicleForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: emptyForm,
  });

  useEffect(() => {
    setPage(1);
    let cancelled = false;
    apiFetch<Vehicle[]>("/vehicles", { params: { search, type: type || undefined, status: status || undefined } })
      .then((data) => { if (!cancelled) setVehicles(data); })
      .catch((err) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load vehicles"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [search, type, status]);

  useEffect(() => {
    apiFetch<string[]>("/vehicles/types").then(setVehicleTypes).catch(() => setVehicleTypes(VEHICLE_TYPES));
  }, []);

  async function onAddVehicle(data: VehicleForm) {
    try {
      await apiFetch("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          capacityKg: Number(data.capacityKg),
          odometer: Number(data.odometer),
          avgCost: Number(data.avgCost),
        }),
      });
      reset(emptyForm);
      setDialogOpen(false);
      setLoading(true);
      setError(null);
      apiFetch<Vehicle[]>("/vehicles", { params: { search, type: type || undefined, status: status || undefined } })
        .then(setVehicles)
        .catch((err) => setError(err instanceof Error ? err.message : "Failed to load vehicles"))
        .finally(() => setLoading(false));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Could not add vehicle";
      if (msg.toLowerCase().includes("unique") || msg.toLowerCase().includes("duplicate")) {
        setFormError("regNo", { message: "Registration number already exists" });
      } else {
        setFormError("root", { message: msg });
      }
    }
  }

  return (
    <div>
      <TopBar onSearch={setSearch} searchPlaceholder="Search vehicles..." />

      <div className="p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <Select value={type} onValueChange={(v) => setType(v ?? "")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {vehicleTypes.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={status} onValueChange={(v) => setStatus(v ?? "")}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Status: All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                {VEHICLE_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button />}>
              + Add Vehicle
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Vehicle</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onAddVehicle)} className="space-y-3">
                {errors.root && (
                  <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                    {errors.root.message}
                  </div>
                )}
                <div className="space-y-1">
                  <Input placeholder="Registration No." {...register("regNo")} />
                  {errors.regNo && <p className="text-xs text-red-500">{errors.regNo.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input placeholder="Make / Model" {...register("makeModel")} />
                  {errors.makeModel && <p className="text-xs text-red-500">{errors.makeModel.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input placeholder="Type (Van/Truck/Mini)" {...register("type")} />
                  {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input type="number" placeholder="Capacity (kg)" {...register("capacityKg")} />
                  {errors.capacityKg && <p className="text-xs text-red-500">{errors.capacityKg.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input type="number" placeholder="Odometer" {...register("odometer")} />
                  {errors.odometer && <p className="text-xs text-red-500">{errors.odometer.message}</p>}
                </div>
                <div className="space-y-1">
                  <Input type="number" step="0.01" placeholder="Avg. Cost" {...register("avgCost")} />
                  {errors.avgCost && <p className="text-xs text-red-500">{errors.avgCost.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Adding..." : "Add Vehicle"}
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

        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reg No.</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Odometer</TableHead>
                <TableHead>Avg. Cost</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : vehicles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    No vehicles found
                  </TableCell>
                </TableRow>
              ) : (
                vehicles.slice((page - 1) * pageSize, page * pageSize).map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-mono text-xs">{v.regNo}</TableCell>
                    <TableCell>{v.makeModel}</TableCell>
                    <TableCell>{v.type}</TableCell>
                    <TableCell>{v.capacityKg.toLocaleString()} kg</TableCell>
                    <TableCell>{v.odometer.toLocaleString()}</TableCell>
                    <TableCell>₹{v.avgCost.toLocaleString()}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <Pagination
          currentPage={page}
          totalPages={Math.max(1, Math.ceil(vehicles.length / pageSize))}
          onPageChange={setPage}
        />
      </div>
    </div>
  );
}
