"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import type { z } from "zod";
import { Truck, Shield } from "lucide-react";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      await login(data.email, data.password);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("423")) {
        setError("Account locked after 5 failed attempts");
      } else if (msg.includes("401")) {
        setError("Invalid credentials");
      } else {
        setError(msg || "Login failed");
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left decorative panel */}
      <div className="hidden w-1/2 flex-col justify-between bg-neutral-50 p-12 dark:bg-neutral-900 lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500" />
            <h1 className="text-xl font-semibold text-foreground">TransitOps</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Smart Transport Operations Platform</p>
        </div>
        <div className="space-y-4">
          <h2 className="text-lg font-medium text-foreground">Who can access?</h2>
          <div className="space-y-3">
            {[
              { role: "Fleet Manager", note: "Full access to all modules" },
              { role: "Dispatcher", note: "Trips, vehicles, drivers" },
              { role: "Safety Officer", note: "Driver compliance, licenses" },
              { role: "Financial Analyst", note: "Expenses, fuel, analytics" },
            ].map(({ role, note }) => (
              <div key={role} className="flex items-start gap-2">
                <Shield className="mt-0.5 h-4 w-4 text-orange-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">{role}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">TransitOps &copy; 2026 &middot; RBAC enabled</p>
      </div>

      {/* Right form panel */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Sign in</h2>
            <p className="text-sm text-muted-foreground">Enter your credentials to continue</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input type="email" placeholder="you@company.com" {...register("email")} />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Password</label>
              <Input type="password" placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;" {...register("password")} />
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <Checkbox checked={rememberMe} onCheckedChange={(v) => setRememberMe(!!v)} />
                Remember me
              </label>
              <a href="#" className="text-xs text-orange-500 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in&hellip;" : "Sign In"}
            </Button>
          </form>

          {/* Mobile-only role info */}
          <div className="pt-4 text-center text-xs text-muted-foreground lg:hidden">
            TransitOps &copy; 2026 &middot; RBAC enabled
          </div>
        </div>
      </div>
    </div>
  );
}
