"use client";

import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider, Toaster, SonnerToaster } from "@tailfire/ui-public";
import { ConsultantProvider } from "@/context/consultant-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ConsultantProvider>
          {children}
          <Toaster />
          <SonnerToaster />
        </ConsultantProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
