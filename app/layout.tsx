import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { cn } from "@/lib/utils";
import { Toaster } from "sonner";
import { auth } from "@/auth";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const APP_NAME = "Workflow Engine Seed";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: APP_NAME,
  description:
    "Standalone dev tool for seeding the sc-workflow-engine database.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", "font-sans", inter.variable)}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers session={session}>
          {children}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
