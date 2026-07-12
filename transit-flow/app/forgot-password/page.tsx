"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setResetToken(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Request failed");
      setMessage(data.message);
      if (data.reset_token) setResetToken(data.reset_token);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-neutral-50 p-12 dark:bg-neutral-900 lg:flex">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500" />
            <h1 className="text-xl font-semibold text-foreground">TransitOps</h1>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Smart Transport Operations Platform</p>
        </div>
        <p className="text-xs text-muted-foreground">TransitOps &copy; 2026</p>
      </div>

      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-sm space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold text-foreground">Forgot password</h2>
            <p className="text-sm text-muted-foreground">Enter your email to receive a reset token</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-md border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-500">
                {message}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Token"}
            </Button>
          </form>

          {resetToken && (
            <div className="rounded-md border border-orange-500/30 bg-orange-500/10 p-3 text-sm">
              <p className="font-medium text-orange-500">Your reset token (demo):</p>
              <p className="mt-1 break-all font-mono text-xs text-foreground">{resetToken}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <Link
                  href={`/reset-password?token=${encodeURIComponent(resetToken)}`}
                  className="text-orange-500 hover:underline"
                >
                  Click here to reset your password
                </Link>
              </p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-orange-500 hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
