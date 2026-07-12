"use client";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/theme-context";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="h-4 w-4" />;
  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 rounded-md p-2 text-neutral-300 hover:bg-neutral-800"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
