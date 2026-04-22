"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];

interface IndividualFormProps {
  onSuccess: () => void;
}

export function IndividualForm({ onSuccess }: IndividualFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    preferredRole: [] as string[],
    experienceLevel: "",
    comments: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (role: string) => {
    setForm((prev) => ({
      ...prev,
      preferredRole: prev.preferredRole.includes(role)
        ? prev.preferredRole.filter((r) => r !== role)
        : [...prev.preferredRole, role],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.preferredRole.length === 0) {
      setError("Please select at least one role");
      return;
    }
    if (!form.experienceLevel) {
      setError("Please select your experience level");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/individual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      setForm({
        fullName: "",
        email: "",
        preferredRole: [],
        experienceLevel: "",
        comments: "",
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
            placeholder="your.email@company.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Role(s) *</label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                form.preferredRole.includes(role)
                  ? "bg-cricket-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-cricket-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level *</label>
        <div className="flex gap-3">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, experienceLevel: level }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.experienceLevel === level
                  ? "bg-cricket-600 text-white shadow-md"
                  : "bg-white text-gray-700 border border-gray-300 hover:border-cricket-300"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
        <textarea
          value={form.comments}
          onChange={(e) => setForm((prev) => ({ ...prev, comments: e.target.value }))}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cricket-500 focus:border-transparent"
          rows={3}
          placeholder="Availability, special requests, etc."
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Register as Individual
      </Button>
    </form>
  );
}
