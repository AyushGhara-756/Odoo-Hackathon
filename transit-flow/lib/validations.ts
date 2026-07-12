import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const vehicleSchema = z.object({
  regNo: z.string().min(1, "Registration number is required"),
  makeModel: z.string().min(1, "Make/Model is required"),
  type: z.string().min(1, "Type is required"),
  capacityKg: z.string().min(1, "Capacity is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be a positive number"),
  odometer: z.string().min(1, "Odometer is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
  avgCost: z.string().min(1, "Cost is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
});

export const driverSchema = z.object({
  name: z.string().min(1, "Name is required"),
  licenseNo: z.string().min(1, "License number is required"),
  category: z.string().min(1, "Category is required"),
  licenseExpiry: z.string().min(1, "License expiry is required"),
  contact: z.string().min(1, "Contact is required"),
});

export const tripSchema = z.object({
  source: z.string().min(1, "Source is required"),
  destination: z.string().min(1, "Destination is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  driverId: z.string().min(1, "Driver is required"),
  cargoWeightKg: z.string().min(1, "Cargo weight is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  plannedDistanceKm: z.string().min(1, "Planned distance is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
});

export const maintenanceSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  serviceType: z.string().min(1, "Service type is required"),
  cost: z.string().min(1, "Cost is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
  date: z.string().min(1, "Date is required"),
  status: z.string().min(1, "Status is required"),
});

export const fuelLogSchema = z.object({
  vehicleId: z.string().min(1, "Vehicle is required"),
  date: z.string().min(1, "Date is required"),
  liters: z.string().min(1, "Liters is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) > 0, "Must be positive"),
  cost: z.string().min(1, "Cost is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
});

export const expenseSchema = z.object({
  tripId: z.string().min(1, "Trip ID is required"),
  vehicleId: z.string().min(1, "Vehicle is required"),
  toll: z.string().min(1, "Toll is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
  other: z.string().min(1, "Other is required").refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Must be 0 or greater"),
});
