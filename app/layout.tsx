import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AlertsProvider } from "@/lib/AlertsContext";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ClimateShield AI",
  description: "Predict. Protect. Prepare. The government-grade climate intelligence platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col font-sans">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AlertsProvider>
            {children}
          </AlertsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
