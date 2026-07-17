"use client";

import { useRef } from "react";
import { Menu, Search, X } from "lucide-react";
import { Input } from "./ui/input";
import { useAuth } from "@/context/auth-context";
import { useMobileNav } from "@/context/mobile-nav-context";
import { ThemeToggle } from "./ToggleTheme";

export function TopBar({
  onSearch,
  searchPlaceholder = "Search...",
}: {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}) {
  const { user } = useAuth();
  const { isOpen, toggle } = useMobileNav();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  }

  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 sm:px-6">
      {/* Hamburger button — visible on mobile only */}
      <button
        onClick={toggle}
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
        aria-label={isOpen ? "Close navigation" : "Open navigation"}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      <div className="relative flex-1 sm:max-w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="w-full pl-8"
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      <div className="flex flex-shrink-0 items-center gap-1">
        <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
        {user ? (
          <>
            <span className="hidden text-sm text-foreground sm:inline">{user.name}</span>
            <span className="rounded-md bg-orange-500/15 px-2 py-0.5 text-xs font-medium text-orange-500">
              {user.role}
            </span>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">Loading session&hellip;</span>
        )}
      </div>
    </div>
  );
}
