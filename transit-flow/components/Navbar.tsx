'use client'

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
} from "lucide-react";
import {
    NavigationMenuItem,
    NavigationMenu,
    NavigationMenuList,
} from "./ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ToggleTheme";
import { useAuth } from "@/context/auth-context";
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

    const visibleModules = user ? ROLE_VISIBILITY[user.role] ?? new Set() : new Set();

    const navItems = ALL_NAV_ITEMS.filter((item) => {
        if (!item.module) return true;
        return visibleModules.has(item.module);
    });

    return (
        <div className="flex h-screen w-56 flex-col justify-between border-r border-neutral-800 bg-neutral-950 py-4">
            <div>
                <div className="px-4 pb-6 flex flex-col gap-1">
                    <Link href={"/dashboard"} className="text-lg text-white">TransitOps</Link>
                    <ThemeToggle />
                </div>
                <NavigationMenu>
                    <NavigationMenuList className="flex flex-col">
                        {navItems.map(({ label, href, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <NavigationMenuItem key={href} className="w-full">
                                    <Link
                                        href={href}
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
}
