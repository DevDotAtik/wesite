import type { Metadata } from "next";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wesite",
  description: "A smart bookmark and website organizer.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning data-theme="light">
      <body className="min-h-full bg-[color:var(--background)] text-[color:var(--foreground)]">
        <ThemeProvider />
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
