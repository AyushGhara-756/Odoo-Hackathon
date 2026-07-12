import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/theme-context";
import { AuthProvider } from "@/context/auth-context";
import Navbar from "@/components/Navbar";

const themeInitScript = `
(function() {
  try {
    var theme = localStorage.getItem('transitops-theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    }
  } catch (e) {}
})();
`;

export const metadata: Metadata = {
  title: "TransitOps — Smart Transport Operations Platform",
  description: "Centralized platform for vehicle, driver, dispatch, maintenance, and expense management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full">
        <ThemeProvider>
          <AuthProvider>
            <div className="flex min-h-screen">
              <Navbar />
              <main className="flex-1 overflow-y-auto">{children}</main>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
