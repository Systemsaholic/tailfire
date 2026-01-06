"use client";

import { useState, useEffect } from "react";

const SESSION_COOKIE = "client_session_id";
const SESSION_MAX_AGE = 180 * 24 * 60 * 60; // 180 days

function generateSessionId() {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

function getCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : undefined;
}

function setCookie(name: string, value: string, maxAge: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function useSessionId() {
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    let id = getCookie(SESSION_COOKIE);
    if (!id) {
      id = generateSessionId();
      setCookie(SESSION_COOKIE, id, SESSION_MAX_AGE);
    }
    setSessionId(id);
  }, []);

  return sessionId;
}
