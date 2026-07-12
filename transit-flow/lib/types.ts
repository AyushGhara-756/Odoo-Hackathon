export type VehicleStatus = "Available" | "On Trip" | "In Shop" | "Retired";
export type DriverStatus = "Available" | "On Trip" | "Off Duty" | "Suspended";
export type TripStatus = "Draft" | "Dispatched" | "Completed" | "Cancelled";
export type MaintenanceStatus = "In Shop" | "Completed" | "Scheduled";
export type ExpenseStatus = "Available" | "Completed";

export interface Vehicle {
  id: string;
  regNo: string;
  makeModel: string;
  type: string;
  capacityKg: number;
  odometer: number;
  avgCost: number;
  status: VehicleStatus;
}

export interface Driver {
  id: string;
  name: string;
  licenseNo: string;
  category: string;
  licenseExpiry: string;
  contact: string;
  tripCompletionPct: number;
  safetyScorePct: number;
  status: DriverStatus;
}

export interface Trip {
  id: string;
  source: string;
  destination: string;
  vehicleId?: string;
  vehicleName?: string;
  driverId?: string;
  driverName?: string;
  cargoWeightKg: number;
  plannedDistanceKm: number;
  status: TripStatus;
  eta?: string;
  note?: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  serviceType: string;
  cost: number;
  date: string;
  status: MaintenanceStatus;
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  vehicleName: string;
  date: string;
  liters: number;
  cost: number;
}

export interface Expense {
  id: string;
  tripId: string;
  vehicleName: string;
  toll: number;
  other: number;
  maintenanceLinked: number;
  total: number;
  status: ExpenseStatus;
}

export interface DashboardSummary {
  activeVehicles: number;
  availableVehicles: number;
  vehiclesInMaintenance: number;
  activeTrips: number;
  pendingTrips: number;
  driversOnDuty: number;
  fleetUtilizationPct: number;
  vehicleStatusBreakdown: Record<VehicleStatus, number>;
}

export interface AnalyticsKPIs {
  fuelEfficiencyKmPerL: number;
  fleetUtilizationPct: number;
  operationalCost: number;
  vehicleRoiPct: number;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface CostliestVehicle {
  vehicleName: string;
  cost: number;
}

export type Role = "Fleet Manager" | "Dispatcher" | "Safety Officer" | "Financial Analyst";

export interface SessionUser {
  name: string;
  role: Role;
}

export interface RbacMatrixRow {
  role: Role;
  fleet: "full" | "view" | "none";
  drivers: "full" | "view" | "none";
  trips: "full" | "view" | "none";
  fuelExpenses: "full" | "view" | "none";
  analytics: "full" | "view" | "none";
}
