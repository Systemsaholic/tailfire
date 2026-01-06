import { useEffect, useState } from "react";

type Stored<T> = {
  data: T;
};

export function useStoredState<T>(key: string, initial: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof localStorage === "undefined") return initial;
    const raw = localStorage.getItem(key);
    if (!raw) return initial;
    try {
      const parsed = JSON.parse(raw) as Stored<T>;
      return parsed.data;
    } catch {
      return initial;
    }
  });

  useEffect(() => {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify({ data: state }));
  }, [key, state]);

  return [state, setState] as const;
}
