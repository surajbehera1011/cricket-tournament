"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface Settings {
  maxTeamSize: number;
  minFemalePerTeam: number;
  tournamentName: string;
  registrationOpen: boolean;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recomputing, setRecomputing] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

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
        <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
        <p className="mt-2 text-gray-600">Only administrators can access settings.</p>
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
      setMessage({ text: "Settings saved successfully", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Failed to save", type: "error" });
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
      setMessage({ text: `Recomputed ${data.count} team(s). ${data.fixed} status(es) corrected.`, type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 5000);
    } catch (err) {
      setMessage({ text: err instanceof Error ? err.message : "Recompute failed", type: "error" });
    } finally {
      setRecomputing(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tournament Settings</h1>
        <p className="mt-1 text-gray-600">Configure tournament rules and constraints</p>
      </div>

      {message.text && (
        <div
          className={`mb-4 px-4 py-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tournament Name
            </label>
            <input
              type="text"
              value={settings.tournamentName}
              onChange={(e) => setSettings({ ...settings, tournamentName: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">Registration Open</label>
              <p className="text-xs text-gray-500 mt-0.5">Allow new registrations</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, registrationOpen: !settings.registrationOpen })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.registrationOpen ? "bg-cricket-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.registrationOpen ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Team Rules</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum Team Size: {settings.maxTeamSize} players
            </label>
            <input
              type="range"
              min={2}
              max={20}
              value={settings.maxTeamSize}
              onChange={(e) => setSettings({ ...settings, maxTeamSize: parseInt(e.target.value) })}
              className="w-full accent-cricket-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>2</span>
              <span>20</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Teams will be marked COMPLETE when they reach this number of players.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum Female Players Per Team: {settings.minFemalePerTeam}
            </label>
            <input
              type="range"
              min={0}
              max={10}
              value={settings.minFemalePerTeam}
              onChange={(e) => setSettings({ ...settings, minFemalePerTeam: parseInt(e.target.value) })}
              className="w-full accent-cricket-600"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>0 (no requirement)</span>
              <span>10</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Teams need at least this many female players to be marked COMPLETE.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6 space-y-3">
        <Button onClick={handleSave} loading={saving} size="lg" className="w-full">
          Save Settings
        </Button>
        <Button
          onClick={handleRecompute}
          loading={recomputing}
          variant="secondary"
          size="lg"
          className="w-full"
        >
          Recompute All Team Statuses
        </Button>
        <p className="text-xs text-gray-400 text-center">
          Use this to fix stale team statuses after changing rules. Also runs automatically on save.
        </p>
      </div>
    </div>
  );
}
