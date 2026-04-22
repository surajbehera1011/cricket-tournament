"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];

interface TeamFormProps {
  onSuccess: () => void;
}

export function TeamForm({ onSuccess }: TeamFormProps) {
  const [form, setForm] = useState({
    teamName: "",
    captainName: "",
    teamSize: 8,
    player1: "",
    player2: "",
    player3: "",
    player4: "",
    player5: "",
    player6: "",
    player7: "",
    player8: "",
    player9: "",
    comments: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const update = (field: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/register/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      setForm({
        teamName: "",
        captainName: "",
        teamSize: 8,
        player1: "",
        player2: "",
        player3: "",
        player4: "",
        player5: "",
        player6: "",
        player7: "",
        player8: "",
        player9: "",
        comments: "",
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const playerFields = Array.from({ length: 9 }, (_, i) => `player${i + 1}` as keyof typeof form);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
          <input
            type="text"
            required
            value={form.teamName}
            onChange={(e) => update("teamName", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="e.g. Royal Strikers"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Captain Name *</label>
          <input
            type="text"
            required
            value={form.captainName}
            onChange={(e) => update("captainName", e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="e.g. Rahul Sharma"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Team Size: {form.teamSize} players
        </label>
        <input
          type="range"
          min={2}
          max={15}
          value={form.teamSize}
          onChange={(e) => update("teamSize", parseInt(e.target.value))}
          className="w-full accent-cricket-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>2</span>
          <span>15</span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Players</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {playerFields.map((field, idx) => (
            <div key={field}>
              <label className="block text-xs text-gray-500 mb-1">
                Player {idx + 1} {idx === 0 ? "*" : ""}
              </label>
              <input
                type="text"
                required={idx === 0}
                value={form[field] as string}
                onChange={(e) => update(field, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
                placeholder={`Player ${idx + 1} name`}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
        <textarea
          value={form.comments}
          onChange={(e) => update("comments", e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
          rows={3}
          placeholder="Any additional notes..."
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Register Team
      </Button>
    </form>
  );
}
