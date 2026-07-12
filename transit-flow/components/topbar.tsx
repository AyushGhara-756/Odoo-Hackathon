"use client";

import { useEffect, useState, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "./ui/input";
import { apiFetch } from "@/lib/api";
import type { SessionUser } from "@/lib/types";

export function TopBar({
  onSearch,
  searchPlaceholder = "Search...",
}: {
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    apiFetch<SessionUser>("/auth/me")
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(value: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch?.(value);
    }, 300);
  }

  return (
    <div className="flex items-center justify-between border-b border-border px-6 py-3">
      <div className="relative w-72">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={searchPlaceholder}
          className="pl-8"
          onChange={(e) => handleChange(e.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        {user ? (
          <>
            <span className="text-sm text-foreground">{user.name}</span>
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
