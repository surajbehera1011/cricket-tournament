"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";

interface Settings {
  maxTeamSize: number;
  minFemalePerTeam: number;
  tournamentName: string;
  registrationOpen: boolean;
  tournamentStartDate: string | null;
  cricketStartDate: string | null;
  pickleballStartDate: string | null;
  cricketRegCloseDate: string | null;
  pickleballRegCloseDate: string | null;
}

function DateInput({ label, hint, value, onChange }: { label: string; hint: string; value: string | null; onChange: (v: string | null) => void }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input
        type="datetime-local"
        value={value ? new Date(value).toISOString().slice(0, 16) : ""}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
      />
      <p className="text-xs text-slate-400 mt-1">{hint}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then(setSettings)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (session?.user?.role !== "ADMIN") {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-slate-200">Access Denied</h1>
        <p className="mt-2 text-slate-500">Only administrators can access settings.</p>
      </div>
    );
  }

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
      const updated = await res.json();
      setSettings(updated);
      toast("Settings saved successfully", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to save", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleRecompute = async () => {
    setRecomputing(true);
    try {
      const res = await fetch("/api/admin/recompute", { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Recompute failed");
      }
      const data = await res.json();
      toast(`Recomputed ${data.count} team(s). ${data.fixed} status(es) corrected.`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Recompute failed", "error");
    } finally {
      setRecomputing(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600" />
      </div>
    );
  }

  const set = (patch: Partial<Settings>) => setSettings({ ...settings, ...patch });

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-100">Tournament Settings</h1>
        <p className="mt-1 text-slate-400">Configure tournament rules and constraints</p>
      </div>

      {/* General */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Tournament Name</label>
            <input
              type="text"
              value={settings.tournamentName}
              onChange={(e) => set({ tournamentName: e.target.value })}
              className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-slate-300">Registration Open</label>
              <p className="text-xs text-slate-500 mt-0.5">Allow new registrations for all sports</p>
            </div>
            <button
              onClick={() => set({ registrationOpen: !settings.registrationOpen })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.registrationOpen ? "bg-brand-600" : "bg-slate-600"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.registrationOpen ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Cricket Dates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">🏏 Cricket Dates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <DateInput
            label="Cricket Tournament Start Date"
            hint="Countdown timer shown on the Cricket dashboard."
            value={settings.cricketStartDate}
            onChange={(v) => set({ cricketStartDate: v })}
          />
          <DateInput
            label="Cricket Registration Close Date"
            hint="A 'Register soon' banner will appear on the dashboard before this date."
            value={settings.cricketRegCloseDate}
            onChange={(v) => set({ cricketRegCloseDate: v })}
          />
        </CardContent>
      </Card>

      {/* Pickleball Dates */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <span className="inline-flex items-center gap-2">🏓 Pickleball Dates</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <DateInput
            label="Pickleball Tournament Start Date"
            hint="Countdown timer shown on the Pickleball dashboard."
            value={settings.pickleballStartDate}
            onChange={(v) => set({ pickleballStartDate: v })}
          />
          <DateInput
            label="Pickleball Registration Close Date"
            hint="A 'Register soon' banner will appear on the dashboard before this date."
            value={settings.pickleballRegCloseDate}
            onChange={(v) => set({ pickleballRegCloseDate: v })}
          />
        </CardContent>
      </Card>

      {/* Cricket Team Rules */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Cricket Team Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Maximum Team Size: {settings.maxTeamSize} players
            </label>
            <input
              type="range" min={2} max={20}
              value={settings.maxTeamSize}
              onChange={(e) => set({ maxTeamSize: parseInt(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>2</span><span>20</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Teams will be marked COMPLETE when they reach this number of players.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Minimum Female Players Per Team: {settings.minFemalePerTeam}
            </label>
            <input
              type="range" min={0} max={10}
              value={settings.minFemalePerTeam}
              onChange={(e) => set({ minFemalePerTeam: parseInt(e.target.value) })}
              className="w-full accent-brand-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1">
              <span>0 (no requirement)</span><span>10</span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Teams need at least this many female players to be marked COMPLETE.</p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
          Save Settings
        </Button>
        <Button onClick={handleRecompute} loading={recomputing} variant="secondary" size="lg" className="w-full">
          Recompute All Team Statuses
        </Button>
        <p className="text-xs text-slate-400 text-center">
          Use this to fix stale team statuses after changing rules. Also runs automatically on save.
        </p>
      </div>
    </div>
  );
}
