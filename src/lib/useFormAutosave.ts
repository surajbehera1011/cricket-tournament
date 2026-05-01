"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export function useFormAutosave<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
    try {
      const stored = localStorage.getItem(`form_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") return { ...initialValue, ...parsed };
      }
    } catch { /* ignore */ }
    return initialValue;
  });

  const [restored, setRestored] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`form_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === "object") {
          const hasContent = Object.values(parsed).some(
            (v) => v !== "" && v !== null && !(Array.isArray(v) && v.length === 0)
          );
          if (hasContent) {
            setValue({ ...initialValue, ...parsed });
            setRestored(true);
          }
        }
      }
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(`form_${key}`, JSON.stringify(value));
      } catch { /* storage full */ }
    }, 500);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [key, value]);

  const clear = useCallback(() => {
    try { localStorage.removeItem(`form_${key}`); } catch { /* ignore */ }
    setRestored(false);
  }, [key]);

  const dismiss = useCallback(() => setRestored(false), []);

  return { value, setValue, restored, clear, dismiss };
}
