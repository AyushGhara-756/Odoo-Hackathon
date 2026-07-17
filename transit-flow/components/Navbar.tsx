"use client";

import {
    BarChart3,
    Fuel,
    LayoutDashboard,
    Route,
    Settings,
    Truck,
    Users,
    Wrench,
    LogOut,
    X,
} from "lucide-react";
import {
    NavigationMenuItem,
    NavigationMenu,
    NavigationMenuList,
} from "./ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { useMobileNav } from "@/context/mobile-nav-context";
import type { Role } from "@/lib/types";

type Module = "fleet" | "drivers" | "trips" | "fuelExpenses" | "analytics";

interface NavItem {
    label: string;
    href: string;
    icon: typeof LayoutDashboard;
    module?: Module;
}

const ALL_NAV_ITEMS: NavItem[] = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Fleet", href: "/fleet", icon: Truck, module: "fleet" },
    { label: "Drivers", href: "/drivers", icon: Users, module: "drivers" },
    { label: "Trips", href: "/trips", icon: Route, module: "trips" },
    { label: "Maintenance", href: "/maintenance", icon: Wrench, module: "fleet" },
    { label: "Fuel & Expenses", href: "/fuel-expenses", icon: Fuel, module: "fuelExpenses" },
    { label: "Analytics", href: "/analytics", icon: BarChart3, module: "analytics" },
    { label: "Settings", href: "/settings", icon: Settings, module: "analytics" },
];

const ROLE_VISIBILITY: Record<Role, Set<Module>> = {
    "Fleet Manager": new Set(["fleet", "drivers", "trips", "fuelExpenses", "analytics"]),
    "Dispatcher": new Set(["trips", "drivers", "fleet"]),
    "Safety Officer": new Set(["drivers", "fleet"]),
    "Financial Analyst": new Set(["fuelExpenses", "analytics"]),
};

export default function Navbar() {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const { isOpen, close } = useMobileNav();

    const visibleModules = user ? ROLE_VISIBILITY[user.role] ?? new Set() : new Set();

    const navItems = ALL_NAV_ITEMS.filter((item) => {
        if (!item.module) return true;
        return visibleModules.has(item.module);
    });

    const nav = (
        <div className="flex h-full flex-col justify-between py-4">
            <div>
                <div className="flex items-center justify-between px-4 pb-6">
                    <Link href={"/dashboard"} className="text-lg text-white" onClick={close}>
                        TransitOps
                    </Link>
                    <button
                        onClick={close}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100 lg:hidden"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <NavigationMenu>
                    <NavigationMenuList className="flex flex-col">
                        {navItems.map(({ label, href, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <NavigationMenuItem key={href} className="w-full">
                                    <Link
                                        href={href}
                                        onClick={close}
                                        className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${isActive
                                            ? "bg-orange-500/10 text-orange-400"
                                            : "text-neutral-400 hover:bg-neutral-800 hover:text-neutral-100"
                                            }`}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </Link>
                                </NavigationMenuItem>
                            );
                        })}
                    </NavigationMenuList>
                </NavigationMenu>
                <div className="px-4 pt-4 text-xs text-neutral-600">
                    TransitOps &copy; 2026
                </div>
            </div>
            {user && (
                <div className="px-4">
                    <button
                        onClick={logout}
                        className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-neutral-100"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* Desktop sidebar */}
            <div className="hidden h-screen w-56 flex-shrink-0 border-r border-neutral-800 bg-neutral-950 lg:flex lg:flex-col">
                {nav}
            </div>

            {/* Mobile drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-56 border-r border-neutral-800 bg-neutral-950 shadow-xl transition-transform duration-300 lg:hidden",
                    isOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                {nav}
            </div>

            {/* Mobile backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={close}
                />
            )}
        </>
    );
}
