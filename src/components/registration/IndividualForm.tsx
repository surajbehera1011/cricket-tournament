"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

interface IndividualFormProps {
  onSuccess: (email: string) => void;
}

export function IndividualForm({ onSuccess }: IndividualFormProps) {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    gender: "" as string,
    preferredRole: [] as string[],
    experienceLevel: "",
    comments: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleRole = (role: string) => {
    setForm((prev) => {
      if (prev.preferredRole.includes(role)) {
        return { ...prev, preferredRole: prev.preferredRole.filter((r) => r !== role) };
      }
      if (prev.preferredRole.length >= 2) return prev;
      return { ...prev, preferredRole: [...prev.preferredRole, role] };
    });
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
    if (!form.gender) {
      setError("Please select your gender");
      return;
    }
    if (!form.email.trim()) {
      setError("Email is required");
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
        gender: "",
        preferredRole: [],
        experienceLevel: "",
        comments: "",
      });
      onSuccess(form.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            placeholder="your.email@company.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Gender *</label>
        <div className="flex gap-3">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.gender === g
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-brand-300"
              }`}
            >
              {g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Preferred Role(s) * <span className="text-slate-400 font-normal">(max 2)</span></label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                form.preferredRole.includes(role)
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-brand-300"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Experience Level *</label>
        <div className="flex gap-3">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, experienceLevel: level }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.experienceLevel === level
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-white text-slate-700 border border-slate-200 hover:border-brand-300"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Comments</label>
        <textarea
          value={form.comments}
          onChange={(e) => setForm((prev) => ({ ...prev, comments: e.target.value }))}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent"
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
