"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Debounces a search string and trims whitespace.
 * Returns the debounced value after `delay` ms of inactivity.
 * Works on both React Native (mobile) and React (web).
 */
export function useDebounceSearch(value: string, delay = 300): string {
  const [debounced, setDebounced] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const trimmed = value.trim();
    if (!trimmed) {
      setDebounced("");
      return;
    }

    timerRef.current = setTimeout(() => setDebounced(trimmed), delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  return debounced;
}
