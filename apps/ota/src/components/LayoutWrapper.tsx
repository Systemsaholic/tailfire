"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Footer } from "@tailfire/ui-public";
import { Navigation } from "@/components/Navigation";

interface LayoutWrapperProps {
  children: ReactNode;
}

export function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  // OTA app doesn't have dashboard routes (they redirect to client app)
  const isDashboard = pathname?.startsWith("/dashboard");

  if (isDashboard) {
    return <>{children}</>;
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen pt-24">{children}</main>
      <Footer />
    </>
  );
}
