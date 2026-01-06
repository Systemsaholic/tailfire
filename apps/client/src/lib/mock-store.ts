"use client";

import { useState, useEffect, useCallback } from "react";

export function useStoredState<T>(key: string, defaultValue: T): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(defaultValue);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // localStorage unavailable
    }
  }, [key]);

  const setAndPersist = useCallback(
    (newValue: T) => {
      setValue(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch {
        // localStorage unavailable
      }
    },
    [key]
  );

  return [value, setAndPersist];
}
