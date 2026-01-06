"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { consultants, type Consultant } from "@/data/consultants";

const COOKIE_NAME = "client_consultant_ref";
const COOKIE_MAX_AGE = 90 * 24 * 60 * 60; // 90 days

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function findConsultantById(id: string): Consultant | undefined {
  const list: Consultant[] = consultants;
  for (let i = 0; i < list.length; i++) {
    const c: Consultant = list[i];
    if (c.id === id) return c;
  }
  return undefined;
}

// Default consultant to use when none is specified
const defaultConsultant: Consultant = {
  id: "consultant_default",
  name: "Phoenix Voyages Team",
  title: "Travel Specialists",
  email: "team@phoenixvoyages.com",
  phone: "+1 (555) 000-0000",
  specialties: ["All Destinations"],
};

type ConsultantContextType = {
  consultant: Consultant;
  consultantId: string | null;
  setConsultantFromRef: (ref: string) => void;
};

const ConsultantContext = createContext<ConsultantContextType | undefined>(
  undefined
);

export function ConsultantProvider({ children }: { children: ReactNode }) {
  const [consultantId, setConsultantId] = useState<string | null>(null);
  const [consultant, setConsultant] = useState<Consultant>(defaultConsultant);

  // On mount, check for stored consultant
  useEffect(() => {
    const storedRef = getCookie(COOKIE_NAME);
    if (storedRef) {
      const found = findConsultantById(storedRef);
      if (found) {
        setConsultantId(storedRef);
        setConsultant(found);
      }
    }
  }, []);

  const setConsultantFromRef = (ref: string) => {
    const found = findConsultantById(ref);
    if (found) {
      setCookie(COOKIE_NAME, ref, COOKIE_MAX_AGE);
      setConsultantId(ref);
      setConsultant(found);
    }
  };

  return (
    <ConsultantContext.Provider
      value={{ consultant, consultantId, setConsultantFromRef }}
    >
      {children}
    </ConsultantContext.Provider>
  );
}

export function useConsultant() {
  const context = useContext(ConsultantContext);
  if (!context) {
    throw new Error("useConsultant must be used within a ConsultantProvider");
  }
  return context;
}
