"use client";

import Link from "next/link";
import { LogIn } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@tailfire/ui-public";
import { useMockAuth } from "@/lib/mock-auth";

type Props = {
  className?: string;
  variant?: "nav" | "card";
};

export const ClientPortalBadge = ({ className, variant = "nav" }: Props) => {
  const { user } = useMockAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // Avoid hydration mismatch by showing nothing until hydrated
  if (!hydrated) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 px-4 py-3 shadow-lg backdrop-blur-sm",
          variant === "nav" ? "min-w-[140px]" : "",
          className,
        )}
      >
        <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/20 animate-pulse" />
        <div className="flex-1 space-y-1">
          <div className="h-3 w-16 bg-secondary/60 rounded animate-pulse" />
          <div className="h-4 w-20 bg-secondary/60 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (user) {
    // User is logged in - show avatar with link to portal
    const initials = user.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    return (
      <Link
        href="/dashboard"
        className={cn(
          "flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl",
          variant === "nav" ? "min-w-[140px]" : "",
          className,
        )}
      >
        <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 bg-secondary/80 shrink-0 flex items-center justify-center">
          <span className="text-sm font-semibold text-primary">{initials}</span>
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-xs uppercase tracking-wide text-secondary-foreground">Client Portal</p>
          <p className="text-sm font-semibold text-primary leading-tight truncate max-w-[100px]">
            {user.name.split(" ")[0]}
          </p>
        </div>
      </Link>
    );
  }

  // User is not logged in - show login prompt
  return (
    <Link
      href="/dashboard"
      className={cn(
        "flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 px-4 py-3 shadow-lg backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-xl",
        variant === "nav" ? "min-w-[140px]" : "",
        className,
      )}
    >
      <div className="relative h-10 w-10 overflow-hidden rounded-full border border-primary/20 bg-secondary/80 shrink-0 flex items-center justify-center">
        <LogIn size={18} className="text-primary" />
      </div>
      <div className="flex-1 space-y-0.5">
        <p className="text-xs uppercase tracking-wide text-secondary-foreground">Client Portal</p>
        <p className="text-sm font-semibold text-primary leading-tight">Join / Sign In</p>
      </div>
    </Link>
  );
};
