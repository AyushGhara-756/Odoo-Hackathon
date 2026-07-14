"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ToggleTheme";
import { useAuth } from "@/context/auth-context";
import {
  Truck,
  ArrowRight,
  BarChart3,
  Users,
  Route,
  Wrench,
  Receipt,
  ShieldCheck,
  LogIn,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Fleet Management",
    description:
      "Maintain a master registry of vehicles with real-time status tracking — Available, On Trip, In Shop, or Retired.",
  },
  {
    icon: Users,
    title: "Driver Management",
    description:
      "Manage driver profiles, license validity, safety scores, and compliance — all in one place.",
  },
  {
    icon: Route,
    title: "Trip Dispatching",
    description:
      "Create and dispatch trips with smart validations — capacity checks, driver eligibility, and automatic status transitions.",
  },
  {
    icon: Wrench,
    title: "Maintenance Tracking",
    description:
      "Log service records and automatically update vehicle status. In-shop vehicles are removed from dispatch instantly.",
  },
  {
    icon: Receipt,
    title: "Fuel & Expenses",
    description:
      "Track fuel consumption, tolls, and maintenance costs. Compute total operational cost per vehicle automatically.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reports",
    description:
      "Visual dashboards with KPIs, monthly revenue charts, fleet utilization, and vehicle ROI analysis.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ── Sticky Nav ── */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href={user ? "/dashboard" : "/"} className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-orange-500" />
            <span className="text-lg font-semibold text-foreground">TransitOps</span>
          </Link>
          <div className="flex items-center gap-1">
            <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
            <Button onClick = {() => router.push("/login")} 
            className="gap-1.5">
              Sign in
            </Button>
            <Button className="gap-1.5" onClick={() => router.push("/signup")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="flex flex-1 items-center justify-center px-6 py-24 md:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500/10">
            <Truck className="h-8 w-8 text-orange-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-foreground md:text-6xl">
            TransitOps
          </h1>
          <p className="mt-3 text-lg text-muted-foreground md:text-xl">
            Smart Transport Operations Platform
          </p>
          <p className="mx-auto mt-4 max-w-xl text-sm text-muted-foreground md:text-base">
            Digitize your fleet, drivers, dispatch, maintenance, and expenses — all
            in one platform. Role-based access for Fleet Managers, Dispatchers,
            Safety Officers, and Financial Analysts.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <Button size="lg" className="gap-1.5" onClick={() => router.push("/signup")}>
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" className="gap-1.5" onClick={() => router.push("/login")}>
              <LogIn className="h-4 w-4" /> Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-border bg-card px-6 py-20 md:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-foreground md:text-4xl">
              Everything you need to manage your fleet
            </h2>
            <p className="mt-3 text-muted-foreground">
              From vehicle registration to expense analytics — TransitOps covers
              the full lifecycle of transport operations.
            </p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group rounded-xl border border-border bg-background p-6 transition hover:border-orange-500/30 hover:shadow-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
                    <Icon className="h-5 w-5 text-orange-500" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {f.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-neutral-950 px-6 py-20 dark:bg-neutral-900 md:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/15">
            <ShieldCheck className="h-6 w-6 text-orange-500" />
          </div>
          <h2 className="text-3xl font-bold text-white md:text-4xl">
            Ready to streamline your transport operations?
          </h2>
          <p className="mt-3 text-neutral-400">
            Join the platform trusted by fleet operators. Get started in minutes.
          </p>
          <Button size="lg" className="mt-8 gap-1.5" onClick={() => router.push("/signup")}>
            Get Started <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border px-6 py-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-orange-500" />
            TransitOps
          </div>
          <p>TransitOps &copy; 2026 &middot; All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
