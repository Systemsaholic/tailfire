"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, type ReactNode } from "react";
import { useState } from "react";

import { Toaster, TooltipProvider } from "@tailfire/ui-public";
import { Toaster as Sonner } from "@tailfire/ui-public";
import { ConsultantProvider } from "@/context/consultant-context";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Suspense fallback={null}>
          <ConsultantProvider>
            {children}
            <Toaster />
            <Sonner />
          </ConsultantProvider>
        </Suspense>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
