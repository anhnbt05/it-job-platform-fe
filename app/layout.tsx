import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import AppProviders from "@/providers/app-providers";

export const metadata: Metadata = {
  title: "IT Job Platform",
  description: "Nen tang tim viec lam nganh IT tai Viet Nam",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (() => {
              try {
                const theme = localStorage.getItem("app-theme");
                const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                const shouldUseDark = theme ? theme === "dark" : prefersDark;
                document.documentElement.classList.toggle("dark", shouldUseDark);
              } catch {}
            })();
          `}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
