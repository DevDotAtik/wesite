import type { Metadata } from "next";
import { Toaster } from "sonner";
import ThemeProvider from "@/components/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wesite — Bold Bookmark Manager",
  description: "A smart bookmark and website organizer with neo-brutalist design.",
};

const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('wesite-theme-preference');
    var pref = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
    var isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    var root = document.documentElement;
    root.classList.toggle('dark', isDark);
    root.dataset.theme = isDark ? 'dark' : 'light';
    root.style.colorScheme = isDark ? 'dark' : 'light';
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning data-theme="light">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full">
        <a
          href="#main-content"
          className="sr-only z-50 focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:rounded-xl focus:border-3 focus:px-4 focus:py-2 focus:font-bold"
          style={{ background: "var(--nb-primary)", color: "var(--nb-primary-fg)", borderColor: "var(--nb-border)" }}
        >
          Skip to content
        </a>
        <div className="nb-noise" aria-hidden="true" />
        <ThemeProvider />
        <main id="main-content">{children}</main>
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
