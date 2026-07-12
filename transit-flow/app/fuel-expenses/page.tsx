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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch } from "@/lib/api";
import type { Expense, FuelLog, Vehicle } from "@/lib/types";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { fuelLogSchema, expenseSchema } from "@/lib/validations";
import { ArrowUp, ArrowDown } from "lucide-react";

interface FuelLogForm {
  vehicleId: string;
  date: string;
  liters: string;
  cost: string;
}

interface ExpenseForm {
  tripId: string;
  vehicleId: string;
  toll: string;
  other: string;
}

const emptyFuelLog: FuelLogForm = { vehicleId: "", date: "", liters: "", cost: "" };
const emptyExpense: ExpenseForm = { tripId: "", vehicleId: "", toll: "", other: "" };

export default function FuelExpensesPage() {
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [totalOperationalCost, setTotalOperationalCost] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fuelDialogOpen, setFuelDialogOpen] = useState(false);
  const [expenseDialogOpen, setExpenseDialogOpen] = useState(false);
  const [fuelSortBy, setFuelSortBy] = useState("");
  const [fuelSortOrder, setFuelSortOrder] = useState("asc");
  const [expenseSortBy, setExpenseSortBy] = useState("");
  const [expenseSortOrder, setExpenseSortOrder] = useState("asc");
  const [fuelPage, setFuelPage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const pageSize = 10;

  const fuelForm = useForm<FuelLogForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(fuelLogSchema) as any,
    defaultValues: emptyFuelLog,
  });

  const expenseForm = useForm<ExpenseForm>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(expenseSchema) as any,
    defaultValues: emptyExpense,
  });

  function fetchAll() {
    setLoading(true);
    setError(null);
    Promise.all([
      apiFetch<FuelLog[]>("/fuel-logs", {
        params: {
          search: search || undefined,
          sort_by: fuelSortBy || undefined,
          sort_order: fuelSortOrder,
        },
      }),
      apiFetch<Expense[]>("/expenses", {
        params: {
          search: search || undefined,
          sort_by: expenseSortBy || undefined,
          sort_order: expenseSortOrder,
        },
      }),
      apiFetch<{ totalOperationalCost: number }>("/expenses/summary"),
    ])
      .then(([fuel, exp, summary]) => {
        setFuelLogs(fuel);
        setExpenses(exp);
        setTotalOperationalCost(summary.totalOperationalCost);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load fuel & expenses"))
      .finally(() => setLoading(false));
  }

  useEffect(fetchAll, [search, fuelSortBy, fuelSortOrder, expenseSortBy, expenseSortOrder]);

  function handleFuelSort(column: string) {
    if (fuelSortBy === column) {
      setFuelSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setFuelSortBy(column);
      setFuelSortOrder("asc");
    }
    setFuelPage(1);
  }

  function handleExpenseSort(column: string) {
    if (expenseSortBy === column) {
      setExpenseSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setExpenseSortBy(column);
      setExpenseSortOrder("asc");
    }
    setExpensePage(1);
  }

  function SortIcon({ column, sortBy, sortOrder }: { column: string; sortBy: string; sortOrder: string }) {
    if (sortBy !== column) return null;
    return sortOrder === "asc" ? <ArrowUp className="inline h-3 w-3" /> : <ArrowDown className="inline h-3 w-3" />;
  }

  useEffect(() => {
    apiFetch<Vehicle[]>("/vehicles").then(setVehicles).catch(() => { });
  }, []);

  async function handleLogFuel(data: FuelLogForm) {
    try {
      await apiFetch("/fuel-logs", {
        method: "POST",
        body: JSON.stringify({ ...data, liters: Number(data.liters), cost: Number(data.cost) }),
      });
      fuelForm.reset(emptyFuelLog);
      setFuelDialogOpen(false);
      fetchAll();
    } catch (err) {
      fuelForm.setError("root", { message: err instanceof Error ? err.message : "Could not log fuel" });
    }
  }

  async function handleAddExpense(data: ExpenseForm) {
    try {
      await apiFetch("/expenses", {
        method: "POST",
        body: JSON.stringify({ ...data, toll: Number(data.toll), other: Number(data.other) }),
      });
      expenseForm.reset(emptyExpense);
      setExpenseDialogOpen(false);
      fetchAll();
    } catch (err) {
      expenseForm.setError("root", { message: err instanceof Error ? err.message : "Could not add expense" });
    }
  }

  return (
    <div>
      <TopBar onSearch={setSearch} searchPlaceholder="Search fuel & expenses..." />

      <div className="p-6 space-y-6">
        {/* Total operational cost at top */}
        {totalOperationalCost !== null && (
          <div className="rounded-md border border-orange-500/20 bg-orange-500/5 px-4 py-3">
            <p className="text-sm text-muted-foreground">Total Operational Cost</p>
            <p className="text-2xl font-bold text-foreground">₹{totalOperationalCost.toLocaleString()}</p>
          </div>
        )}

        <div className="flex flex-row gap-0.5">
          <div className="flex justify-end gap-2">
            <Dialog open={fuelDialogOpen} onOpenChange={setFuelDialogOpen}>
              <DialogTrigger render={<Button />}>
                + Log Fuel
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Fuel</DialogTitle>
                </DialogHeader>
                <form onSubmit={fuelForm.handleSubmit(handleLogFuel)} className="space-y-3">
                  {fuelForm.formState.errors.root && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                      {fuelForm.formState.errors.root.message}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Vehicle</label>
                    <Select
                      value={fuelForm.watch("vehicleId")}
                      onValueChange={(v) => fuelForm.setValue("vehicleId", v ?? "")}
                    >
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
                    {fuelForm.formState.errors.vehicleId && (
                      <p className="text-xs text-red-500">{fuelForm.formState.errors.vehicleId.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Date</label>
                    <Input type="date" {...fuelForm.register("date")} />
                    {fuelForm.formState.errors.date && (
                      <p className="text-xs text-red-500">{fuelForm.formState.errors.date.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Liters</label>
                    <Input type="number" {...fuelForm.register("liters")} />
                    {fuelForm.formState.errors.liters && (
                      <p className="text-xs text-red-500">{fuelForm.formState.errors.liters.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Cost</label>
                    <Input type="number" {...fuelForm.register("cost")} />
                    {fuelForm.formState.errors.cost && (
                      <p className="text-xs text-red-500">{fuelForm.formState.errors.cost.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={fuelForm.formState.isSubmitting}>
                    Save
                  </Button>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={expenseDialogOpen} onOpenChange={setExpenseDialogOpen}>
              <DialogTrigger render={<Button variant="outline" />}>
                + Add Expense
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Expense</DialogTitle>
                </DialogHeader>
                <form onSubmit={expenseForm.handleSubmit(handleAddExpense)} className="space-y-3">
                  {expenseForm.formState.errors.root && (
                    <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                      {expenseForm.formState.errors.root.message}
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Trip</label>
                    <Input placeholder="Trip ID" {...expenseForm.register("tripId")} />
                    {expenseForm.formState.errors.tripId && (
                      <p className="text-xs text-red-500">{expenseForm.formState.errors.tripId.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Vehicle</label>
                    <Select
                      value={expenseForm.watch("vehicleId")}
                      onValueChange={(v) => expenseForm.setValue("vehicleId", v ?? "")}
                    >
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
                    {expenseForm.formState.errors.vehicleId && (
                      <p className="text-xs text-red-500">{expenseForm.formState.errors.vehicleId.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Toll</label>
                    <Input type="number" {...expenseForm.register("toll")} />
                    {expenseForm.formState.errors.toll && (
                      <p className="text-xs text-red-500">{expenseForm.formState.errors.toll.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">Other</label>
                    <Input type="number" {...expenseForm.register("other")} />
                    {expenseForm.formState.errors.other && (
                      <p className="text-xs text-red-500">{expenseForm.formState.errors.other.message}</p>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={expenseForm.formState.isSubmitting}>
                    Save
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

          {/* Fuel logs */}
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Fuel Logs</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleFuelSort("date")}>
                    Date <SortIcon column="date" sortBy={fuelSortBy} sortOrder={fuelSortOrder} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleFuelSort("liters")}>
                    Liters <SortIcon column="liters" sortBy={fuelSortBy} sortOrder={fuelSortOrder} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleFuelSort("cost")}>
                    Cost <SortIcon column="cost" sortBy={fuelSortBy} sortOrder={fuelSortOrder} />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <LoadingSpinner />
                    </TableCell>
                  </TableRow>
                ) : fuelLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No fuel logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  fuelLogs.slice((fuelPage - 1) * pageSize, fuelPage * pageSize).map((f) => (
                    <TableRow key={f.id}>
                      <TableCell>{f.vehicleName}</TableCell>
                      <TableCell>{f.date}</TableCell>
                      <TableCell>{f.liters} L</TableCell>
                      <TableCell>₹{f.cost.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={fuelPage}
              totalPages={Math.max(1, Math.ceil(fuelLogs.length / pageSize))}
              onPageChange={setFuelPage}
            />
          </div>

          {/* Other expenses */}
          <div className="rounded-md border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-medium text-foreground">Other Expenses (Toll / Misc)</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleExpenseSort("tripId")}>
                    Trip <SortIcon column="tripId" sortBy={expenseSortBy} sortOrder={expenseSortOrder} />
                  </TableHead>
                  <TableHead>Vehicle</TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleExpenseSort("toll")}>
                    Toll <SortIcon column="toll" sortBy={expenseSortBy} sortOrder={expenseSortOrder} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleExpenseSort("other")}>
                    Other <SortIcon column="other" sortBy={expenseSortBy} sortOrder={expenseSortOrder} />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none" onClick={() => handleExpenseSort("maintenanceLinked")}>
                    Maint. <SortIcon column="maintenanceLinked" sortBy={expenseSortBy} sortOrder={expenseSortOrder} />
                  </TableHead>
                  <TableHead>Total</TableHead>
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
                ) : expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No expenses found
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.slice((expensePage - 1) * pageSize, expensePage * pageSize).map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.tripId}</TableCell>
                      <TableCell>{e.vehicleName}</TableCell>
                      <TableCell>₹{e.toll.toLocaleString()}</TableCell>
                      <TableCell>₹{e.other.toLocaleString()}</TableCell>
                      <TableCell>₹{e.maintenanceLinked.toLocaleString()}</TableCell>
                      <TableCell>₹{e.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <StatusBadge status={e.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
            <Pagination
              currentPage={expensePage}
              totalPages={Math.max(1, Math.ceil(expenses.length / pageSize))}
              onPageChange={setExpensePage}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
