"use client";

import { useEffect, useState } from "react";
import { TopBar } from "@/components/topbar";
import { LoadingSpinner } from "@/components/LoadingSpinner";
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
import type { RbacMatrixRow } from "@/lib/types";

interface GeneralSettings {
  depotName: string;
  currency: string;
  distanceUnit: string;
}

const PERMISSION_SYMBOL: Record<string, string> = {
  full: "✓",
  view: "view",
  none: "—",
};

const MODULES: { key: keyof Omit<RbacMatrixRow, "role">; label: string }[] = [
  { key: "fleet", label: "Fleet" },
  { key: "drivers", label: "Drivers" },
  { key: "trips", label: "Trips" },
  { key: "fuelExpenses", label: "Fuel/Exp" },
  { key: "analytics", label: "Analytics" },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings | null>(null);
  const [rbacMatrix, setRbacMatrix] = useState<RbacMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<GeneralSettings>("/settings"),
      apiFetch<RbacMatrixRow[]>("/settings/rbac-matrix"),
    ])
      .then(([s, matrix]) => {
        setSettings(s);
        setRbacMatrix(matrix);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load settings"))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setSaveError(null);
    setSaving(true);
    try {
      await apiFetch("/settings", { method: "PATCH", body: JSON.stringify(settings) });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <TopBar searchPlaceholder="Search settings..." />

      <div className="p-6 space-y-6">
        {error && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
            {error}
          </div>
        )}

        {/* General settings */}
        <div className="rounded-md border border-border bg-card p-4">
          <h3 className="mb-4 text-sm font-medium text-foreground">General</h3>
          {loading || !settings ? (
            <div className="h-24 animate-pulse rounded-md bg-muted" />
          ) : (
            <form onSubmit={handleSave} className="space-y-3 max-w-md">
              {saveError && (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 p-2 text-sm text-red-500">
                  {saveError}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Depot Name</label>
                <Input
                  value={settings.depotName}
                  onChange={(e) => setSettings({ ...settings, depotName: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Currency</label>
                <Select
                  value={settings.currency}
                  onValueChange={(v) => setSettings({ ...settings, currency: v ?? "" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INR">INR (₹)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">Distance Unit</label>
                <Select
                  value={settings.distanceUnit}
                  onValueChange={(v) => setSettings({ ...settings, distanceUnit: v ?? "" })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="km">Kilometers</SelectItem>
                    <SelectItem value="mi">Miles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button type="submit" disabled={saving}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </form>
          )}
        </div>

        {/* RBAC matrix (desktop) */}
        <div className="hidden rounded-md border border-border bg-card md:block">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-medium text-foreground">Role-Based Access (RBAC)</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                {MODULES.map((m) => (
                  <TableHead key={m.key}>{m.label}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={MODULES.length + 1}>
                    <LoadingSpinner />
                  </TableCell>
                </TableRow>
              ) : (
                rbacMatrix.map((row) => (
                  <TableRow key={row.role}>
                    <TableCell className="font-medium text-foreground">{row.role}</TableCell>
                    {MODULES.map((m) => (
                      <TableCell key={m.key}>{PERMISSION_SYMBOL[row[m.key]]}</TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* RBAC matrix (mobile) */}
        <div className="space-y-3 md:hidden">
          <h3 className="text-sm font-medium text-foreground">Role-Based Access (RBAC)</h3>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-md border border-border bg-card" />
            ))
          ) : (
            rbacMatrix.map((row) => (
              <div key={row.role} className="rounded-md border border-border bg-card p-4">
                <p className="text-sm font-medium text-foreground">{row.role}</p>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {MODULES.map((m) => (
                    <span key={m.key}>
                      {m.label}: {PERMISSION_SYMBOL[row[m.key]]}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
