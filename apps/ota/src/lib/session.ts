import { useEffect, useState } from "react";

const SESSION_KEY = "pv_session_id";

export function getSessionId() {
  if (typeof document === "undefined") return "";
  const existing = document.cookie
    ?.split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${SESSION_KEY}=`));
  if (existing) {
    return existing.split("=")[1] ?? "";
  }
  const id = crypto.randomUUID();
  document.cookie = `${SESSION_KEY}=${id}; path=/; max-age=${60 * 60 * 24 * 180}; samesite=lax`;
  return id;
}

export function useSessionId() {
  const [sessionId, setSessionId] = useState("");
  useEffect(() => {
    setSessionId(getSessionId());
  }, []);
  return sessionId;
}
