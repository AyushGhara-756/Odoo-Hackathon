"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/topbar";
import { StatusBadge } from "@/components/status-badge";
import { TripStepper } from "@/components/trip-stepper";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import type { Driver, Trip, Vehicle } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripSchema } from "@/lib/validations";

interface TripForm {
  source: string;
  destination: string;
  vehicleId: string;
  driverId: string;
  cargoWeightKg: string;
  plannedDistanceKm: string;
}

const emptyForm: TripForm = {
  source: "",
  destination: "",
  vehicleId: "",
  driverId: "",
  cargoWeightKg: "",
  plannedDistanceKm: "",
};

const LIVE_POLL_MS = 20000;

export default function TripsPage() {
  const [availableVehicles, setAvailableVehicles] = useState<Vehicle[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [liveTrips, setLiveTrips] = useState<Trip[]>([]);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
    setError: setFormError,
  } = useForm<TripForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(tripSchema) as any,
    defaultValues: emptyForm,
  });

  const vehicleId = watch("vehicleId");
  const cargoWeightKg = watch("cargoWeightKg");

  const selectedVehicle = availableVehicles.find((v) => v.id === vehicleId);
  const cargoWeight = Number(cargoWeightKg) || 0;
  const capacityExceeded = !!selectedVehicle && cargoWeight > selectedVehicle.capacityKg;

  useEffect(() => {
    apiFetch<Vehicle[]>("/vehicles", { params: { status: "Available" } }).then(setAvailableVehicles);
    apiFetch<Driver[]>("/drivers", { params: { status: "Available", licenseValid: true } }).then(
      setAvailableDrivers
    );
  }, []);

  useEffect(() => {
    function fetchLive() {
      apiFetch<Trip[]>("/trips/live").then(setLiveTrips).catch(() => {});
    }
    fetchLive();
    const interval = setInterval(fetchLive, LIVE_POLL_MS);
    return () => clearInterval(interval);
  }, []);

  async function onDispatch(data: TripForm) {
    if (capacityExceeded) return;
    try {
      await apiFetch("/trips", {
        method: "POST",
        body: JSON.stringify({
          ...data,
          cargoWeightKg: Number(data.cargoWeightKg),
          plannedDistanceKm: Number(data.plannedDistanceKm),
        }),
      });
      reset(emptyForm);
      apiFetch<Trip[]>("/trips/live").then(setLiveTrips).catch(() => {});
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not dispatch trip" });
    }
  }

  async function handleCompleteTrip(tripId: string) {
    try {
      await apiFetch(`/trips/${tripId}/complete`, { method: "PATCH" });
      apiFetch<Trip[]>("/trips/live").then(setLiveTrips).catch(() => {});
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not complete trip" });
    }
  }

  async function handleCancelTrip(tripId: string) {
    try {
      await apiFetch(`/trips/${tripId}/cancel`, { method: "PATCH" });
      apiFetch<Trip[]>("/trips/live").then(setLiveTrips).catch(() => {});
    } catch (err) {
      setFormError("root", { message: err instanceof Error ? err.message : "Could not cancel trip" });
    }
  }

  function handleCancelForm() {
    reset(emptyForm);
  }

  return (
    <div>
      <TopBar searchPlaceholder="Search trips..." />

      <div className="p-6">
        <div className="mb-6">
          <TripStepper currentStatus={selectedTripId ? (liveTrips.find(t => t.id === selectedTripId)?.status ?? "Draft") : "Draft"} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Create trip form */}
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">Create Trip</h3>
            <form onSubmit={handleSubmit(onDispatch)} className="space-y-3">
              {errors.root && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                  {errors.root.message}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Source</label>
                <Input {...register("source")} />
                {errors.source && <p className="text-xs text-red-500">{errors.source.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Destination</label>
                <Input {...register("destination")} />
                {errors.destination && <p className="text-xs text-red-500">{errors.destination.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Vehicle (available only)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("vehicleId")}
                >
                  <option value="">Select vehicle</option>
                  {availableVehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.regNo} — {v.capacityKg} kg capacity
                    </option>
                  ))}
                </select>
                {errors.vehicleId && <p className="text-xs text-red-500">{errors.vehicleId.message}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Driver (available only)</label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  {...register("driverId")}
                >
                  <option value="">Select driver</option>
                  {availableDrivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
                {errors.driverId && <p className="text-xs text-red-500">{errors.driverId.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Cargo Weight (kg)</label>
                  <Input type="number" {...register("cargoWeightKg")} />
                  {errors.cargoWeightKg && <p className="text-xs text-red-500">{errors.cargoWeightKg.message}</p>}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">Planned Distance (km)</label>
                  <Input type="number" {...register("plannedDistanceKm")} />
                  {errors.plannedDistanceKm && <p className="text-xs text-red-500">{errors.plannedDistanceKm.message}</p>}
                </div>
              </div>

              {capacityExceeded && selectedVehicle && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-500">
                  <p>Vehicle Capacity {selectedVehicle.capacityKg} kg</p>
                  <p>Cargo Weight {cargoWeight} kg</p>
                  <p className="mt-1 font-medium">
                    ✗ Capacity exceeded by {cargoWeight - selectedVehicle.capacityKg} kg — dispatch blocked
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={capacityExceeded || isSubmitting}>
                  {isSubmitting ? "Dispatching…" : "Dispatch"}
                </Button>
                <Button type="button" variant="outline" onClick={handleCancelForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </div>

          {/* Live board */}
          <div className="rounded-md border border-border bg-card p-4">
            <h3 className="mb-4 text-sm font-medium text-foreground">Live Board</h3>
            <div className="space-y-3">
              {liveTrips.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active trips</p>
              ) : (
                liveTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className={`rounded-md border p-3 ${selectedTripId === trip.id ? "border-orange-500" : "border-border"}`}
                    onClick={() => setSelectedTripId(trip.id)}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{trip.id}</span>
                      <StatusBadge status={trip.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trip.source} → {trip.destination}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {trip.vehicleName ?? "Unassigned"} / {trip.driverName ?? "Unassigned"}
                    </p>
                    {(trip.eta || trip.note) && (
                      <p className="mt-1 text-xs text-muted-foreground">{trip.eta ?? trip.note}</p>
                    )}
                    {trip.status === "Dispatched" && (
                      <div className="mt-2 flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={(e) => { e.stopPropagation(); handleCompleteTrip(trip.id); }}
                        >
                          Complete
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleCancelTrip(trip.id); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                    {trip.status === "Draft" && (
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); handleCancelTrip(trip.id); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          On complete: odometer → fuel log → expenses → Vehicle & Driver Available
        </p>
      </div>
    </div>
  );
}
