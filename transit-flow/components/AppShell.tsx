"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { MobileNavProvider } from "@/context/mobile-nav-context";
import Navbar from "@/components/Navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname === "/signup" || pathname === "/forgot-password" || pathname === "/reset-password";

  if (isPublicPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
      </div>
    );
  }

  return (
    <MobileNavProvider>
      <div className="flex min-h-screen">
        {user && <Navbar />}
        <main className="flex flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </MobileNavProvider>
  );
}
