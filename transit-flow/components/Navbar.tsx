'use client'

import {
    BarChart3,
    Fuel,
    LayoutDashboard,
    Route,
    Settings,
    Truck,
    Users,
    Wrench
} from "lucide-react";
import {
    NavigationMenuItem,
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuLink
} from "./ui/navigation-menu";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ToggleTheme";

const navItems = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Fleet", href: "/fleet", icon: Truck },
    { label: "Drivers", href: "/drivers", icon: Users },
    { label: "Trips", href: "/trips", icon: Route },
    { label: "Maintenance", href: "/maintenance", icon: Wrench },
    { label: "Fuel & Expenses", href: "/fuel-expenses", icon: Fuel },
    { label: "Analytics", href: "/analytics", icon: BarChart3 },
    { label: "Settings", href: "/settings", icon: Settings },
];

export default function Navbar() {

    const pathname = usePathname();

    return (
        <div className="flex h-screen w-56 flex-col justify-between border-r border-neutral-800 bg-neutral-950 py-4">
            <div>
                <div className="px-4 pb-6 flex flex-col gap-1">
                    <h1 className="text-lg text-white">TransitOps</h1>
                    <ThemeToggle/>
                </div>
                <NavigationMenu >
                    <NavigationMenuList className="flex flex-col">
                        {navItems.map(({ label, href, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <NavigationMenuItem key={href} className="w-full">
                                    <NavigationMenuLink active={isActive}>
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
                                    </NavigationMenuLink>
                                </NavigationMenuItem>
                            );
                        })}
                    </NavigationMenuList>
                </NavigationMenu>
                <div className="px-4 pt-4 text-xs text-neutral-600">
                    TransitOps 2026
                </div>
            </div>
        </div>
    );
}