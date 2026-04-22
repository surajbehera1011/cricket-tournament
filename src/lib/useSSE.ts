"use client";

import { useEffect, useCallback, useRef } from "react";

export function useSSE(onEvent: () => void) {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    const es = new EventSource("/api/events");

    es.addEventListener("team-updated", () => onEventRef.current());
    es.addEventListener("player-assigned", () => onEventRef.current());
    es.addEventListener("player-removed", () => onEventRef.current());
    es.addEventListener("registration-created", () => onEventRef.current());

    es.onerror = () => {
      es.close();
      setTimeout(connect, 5000);
    };

    return es;
  }, []);

  useEffect(() => {
    const es = connect();
    return () => es.close();
  }, [connect]);
}
