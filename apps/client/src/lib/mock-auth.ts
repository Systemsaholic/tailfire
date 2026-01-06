"use client";

import { useState, useEffect, useCallback } from "react";
import { useStoredState } from "./mock-store";

export type MockUser = {
  id: string;
  email: string;
  name: string;
  associatedConsultantId?: string;
};

const STORAGE_KEY = "client_mock_auth_user";

export function useMockAuth() {
  const [user, setUser] = useStoredState<MockUser | null>(STORAGE_KEY, null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const login = useCallback(
    (email: string, name: string, consultantId?: string): Promise<void> => {
      const newUser: MockUser = {
        id: `user_${Date.now()}`,
        email,
        name,
        associatedConsultantId: consultantId,
      };
      setUser(newUser);
      return Promise.resolve();
    },
    [setUser]
  );

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const assignConsultant = useCallback(
    (consultantId: string) => {
      if (user) {
        setUser({ ...user, associatedConsultantId: consultantId });
      }
    },
    [user, setUser]
  );

  return { user, loading, login, logout, assignConsultant };
}
