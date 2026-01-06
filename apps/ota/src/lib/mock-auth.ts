"use client";

import { useEffect, useState } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  associatedConsultantId?: string;
};

// Use app-specific storage key to avoid collisions
const STORAGE_KEY = "ota_mock_auth_user";

function loadUser(): User | null {
  if (typeof localStorage === "undefined") return null;
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function saveUser(user: User | null) {
  if (typeof localStorage === "undefined") return;
  if (user) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export function useMockAuth() {
  const [user, setUser] = useState<User | null>(null);
  // Start with loading=true to prevent flash of unauthenticated content
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user from localStorage after hydration to prevent mismatch
    setUser(loadUser());
    setLoading(false);

    // Sync with storage changes (for multi-tab support)
    const listener = () => setUser(loadUser());
    window.addEventListener("storage", listener);
    return () => window.removeEventListener("storage", listener);
  }, []);

  const login = (email: string, name: string, consultantId?: string): Promise<User> => {
    setLoading(true);
    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      associatedConsultantId: consultantId,
    };
    saveUser(newUser);
    setUser(newUser);
    setLoading(false);
    return Promise.resolve(newUser);
  };

  const logout = () => {
    saveUser(null);
    setUser(null);
  };

  const assignConsultant = (consultantId?: string) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }
      const updatedUser = { ...currentUser, associatedConsultantId: consultantId };
      saveUser(updatedUser);
      return updatedUser;
    });
  };

  return { user, loading, login, logout, assignConsultant };
}

export type { User };
