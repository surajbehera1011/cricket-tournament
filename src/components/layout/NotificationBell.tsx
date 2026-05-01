"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  link: string | null;
  createdAt: string;
}

export function NotificationBell() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (status !== "authenticated") return;
    const fetchNotifs = () =>
      fetch("/api/notifications")
        .then((r) => r.json())
        .then((d) => {
          setNotifications(d.notifications || []);
          setUnreadCount(d.unreadCount || 0);
        })
        .catch(() => {});
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [status]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (status !== "authenticated" || !session?.user) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-white transition-colors relative"
        aria-label="Notifications"
      >
        <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 w-80 max-h-96 overflow-y-auto rounded-xl bg-dark-500/95 backdrop-blur-xl border border-white/[0.08] shadow-xl shadow-black/30 z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-[11px] text-brand-400 hover:text-brand-300 font-medium">
                Mark all read
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {notifications.map((n) => (
                <a
                  key={n.id}
                  href={n.link || "#"}
                  onClick={() => setOpen(false)}
                  className={`block px-4 py-3 hover:bg-white/[0.03] transition-colors ${!n.read ? "bg-brand-500/5" : ""}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && <span className="w-2 h-2 mt-1.5 rounded-full bg-brand-400 flex-shrink-0" />}
                    <div className={!n.read ? "" : "ml-4"}>
                      <p className="text-sm font-medium text-white">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
