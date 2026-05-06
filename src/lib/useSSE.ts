"use client";

import { useEffect, useRef } from "react";

export function useSSE(onEvent: () => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const interval = setInterval(() => {
      onEventRef.current();
    }, 60000);

    const onFocus = () => onEventRef.current();
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);
}
