"use client";

import Image from "next/image";
import Link from "next/link";
import { Phone, Mail, UserCircle2, UserSearch } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@tailfire/ui-public";
import { useConsultant } from "@/context/consultant-context";
import { consultants, defaultConsultantId } from "@/data/consultants";
import { useMockAuth } from "@/lib/mock-auth";

type Props = {
  className?: string;
  variant?: "nav" | "card";
};

export const ConsultantBadge = ({ className, variant = "nav" }: Props) => {
  const { consultant } = useConsultant();
  const { user } = useMockAuth();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  const baseConsultant = hydrated ? consultant : (consultants[defaultConsultantId] ?? consultant);
  const assignedConsultant = user?.associatedConsultantId
    ? consultants[user.associatedConsultantId]
    : undefined;
  const displayConsultant = assignedConsultant ?? baseConsultant;

  const initials = displayConsultant.name
    .split(" ")
    .slice(0, 2)
    .map((part: string) => part[0])
    .join("");

  const baseCardClasses =
    "flex items-center gap-3 rounded-xl border border-primary/20 bg-secondary/60 px-4 py-3 shadow-lg backdrop-blur-sm";
  const badgeClassName = cn(
    baseCardClasses,
    "transition-all duration-300 hover:border-primary/30 hover:shadow-xl",
    variant === "nav" ? "min-w-[260px]" : "",
    className,
  );

  const fallbackClassName = cn(baseCardClasses, variant === "nav" ? "min-w-[260px]" : "", className);

  if (!hydrated) {
    return (
      <div className={fallbackClassName}>
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-primary/20 bg-secondary/80 shrink-0 animate-pulse" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-1/2 bg-secondary/60 rounded-full animate-pulse" />
          <div className="h-4 w-3/4 bg-secondary/60 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  if (user && !user.associatedConsultantId) {
    return (
      <Link href="/advisors" className={badgeClassName}>
        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-primary/20 bg-secondary/80 shrink-0 flex items-center justify-center">
          <UserSearch size={22} className="text-primary" />
        </div>
        <div className="flex-1 space-y-0.5">
          <p className="text-xs uppercase tracking-wide text-secondary-foreground">Your Advisor</p>
          <p className="text-sm font-semibold text-primary leading-tight">Find an Advisor</p>
        </div>
      </Link>
    );
  }

  return (
    <div className={badgeClassName}>
      <div className="relative h-12 w-12 overflow-hidden rounded-full border border-primary/20 bg-secondary/80 shrink-0">
        {displayConsultant.avatar ? (
          <Image
            src={displayConsultant.avatar}
            alt={displayConsultant.name}
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-secondary-foreground/80">
            {initials}
          </div>
        )}
      </div>

      <div className="flex-1 space-y-0.5">
        <p className="text-xs uppercase tracking-wide text-secondary-foreground">Your Advisor</p>
        <p
          className="text-sm font-semibold text-primary leading-tight"
          suppressHydrationWarning
        >
          {displayConsultant.name}
        </p>
        <div className="flex items-center gap-3 text-xs text-secondary-foreground whitespace-nowrap">
          {displayConsultant.email ? (
            <a
              suppressHydrationWarning
              href={`mailto:${displayConsultant.email}`}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Mail size={14} />
              Email
            </a>
          ) : null}
          {displayConsultant.phone ? (
            <a
              suppressHydrationWarning
              href={`tel:${displayConsultant.phone}`}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <Phone size={14} />
              Call
            </a>
          ) : null}
          {displayConsultant.bioUrl ? (
            <Link
              href={displayConsultant.bioUrl}
              className="inline-flex items-center gap-1 hover:text-primary transition-colors"
            >
              <UserCircle2 size={14} />
              Profile
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
};
