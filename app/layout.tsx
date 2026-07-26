import type { Metadata } from "next";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wesite — Bold Bookmark Manager",
  description: "A smart bookmark and website organizer with neo-brutalist design.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning data-theme="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <ThemeProvider />
        {children}
        <Toaster
          richColors
          position="top-right"
          toastOptions={{
            style: {
              border: "3px solid var(--nb-border)",
              borderRadius: "12px",
              fontFamily: "var(--nb-font)",
              fontWeight: 600,
              boxShadow: "5px 5px 0 0 var(--nb-shadow)",
            },
          }}
        />
      </body>
    </html>
  );
}
