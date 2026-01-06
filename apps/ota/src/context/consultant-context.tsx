"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { consultants, defaultConsultantId, type Consultant } from "@/data/consultants";

const COOKIE_NAME = "consultant_ref";
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

type ConsultantState = {
  consultantId: string;
  consultant: Consultant;
};

const ConsultantContext = createContext<ConsultantState | undefined>(undefined);

function getCookieValue(name: string) {
  if (typeof document === "undefined") return undefined;
  const cookies = document.cookie?.split(";") ?? [];
  const match = cookies.find((c) => c.trim().startsWith(`${name}=`));
  return match?.split("=")[1];
}

function setCookieValue(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
}

function isValidConsultant(id: string | null | undefined) {
  return Boolean(id && consultants[id]);
}

export function ConsultantProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialized = useRef(false);

  const [consultantId, setConsultantId] = useState<string>(() => {
    const cookieValue = getCookieValue(COOKIE_NAME);
    return isValidConsultant(cookieValue) ? (cookieValue as string) : defaultConsultantId;
  });

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const refParam = searchParams.get("ref");
    const cookieValue = getCookieValue(COOKIE_NAME);

    let resolvedId = consultantId;

    if (isValidConsultant(refParam)) {
      resolvedId = refParam as string;
      setCookieValue(COOKIE_NAME, resolvedId, COOKIE_MAX_AGE_SECONDS);
      const params = new URLSearchParams(searchParams.toString());
      params.delete("ref");
      const newQuery = params.toString();
      const cleanPath = newQuery ? `${pathname}?${newQuery}` : pathname;
      router.replace(cleanPath, { scroll: false });
    } else if (isValidConsultant(cookieValue)) {
      resolvedId = cookieValue as string;
    } else {
      resolvedId = defaultConsultantId;
    }

    setConsultantId(resolvedId);
  }, [consultantId, pathname, router, searchParams]);

  const value = useMemo<ConsultantState>(() => {
    const consultant = consultants[consultantId] ?? consultants[defaultConsultantId]!;
    return { consultantId, consultant };
  }, [consultantId]);

  return <ConsultantContext.Provider value={value}>{children}</ConsultantContext.Provider>;
}

export function useConsultant() {
  const context = useContext(ConsultantContext);
  if (!context) {
    throw new Error("useConsultant must be used within a ConsultantProvider");
  }
  return context;
}

export function useConsultantId() {
  return useConsultant().consultantId;
}

export function attachConsultant<T extends Record<string, unknown>>(
  payload: T,
  consultantId: string,
) {
  return { ...payload, consultantId };
}
