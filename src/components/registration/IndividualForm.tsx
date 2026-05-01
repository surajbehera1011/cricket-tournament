"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { useFormAutosave } from "@/lib/useFormAutosave";

const ROLES = ["Batsman", "Bowler", "All-Rounder", "Wicket Keeper"];
const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;

interface IndividualFormProps {
  onSuccess: (email: string) => void;
}

interface IndFormData {
  fullName: string;
  email: string;
  gender: string;
  preferredRole: string[];
  experienceLevel: string;
  comments: string;
}

export function IndividualForm({ onSuccess }: IndividualFormProps) {
  const initial: IndFormData = { fullName: "", email: "", gender: "", preferredRole: [], experienceLevel: "", comments: "" };
  const { value: form, setValue: setForm, restored, clear: clearSaved, dismiss } = useFormAutosave<IndFormData>("individual", initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [shakeKey, setShakeKey] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);

  const showError = useCallback((msg: string, fields: string[] = []) => {
    setError(msg);
    setErrorFields(new Set(fields));
    setShakeKey((k) => k + 1);
    setTimeout(() => {
      errorRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  const isFieldError = (field: string) => errorFields.has(field);

  const clearError = () => {
    if (error) { setError(""); setErrorFields(new Set()); }
  };

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
    setError(""); setErrorFields(new Set());

    if (form.preferredRole.length === 0) {
      showError("Please select at least one role", ["role"]);
      return;
    }
    if (!form.experienceLevel) {
      showError("Please select your experience level", ["level"]);
      return;
    }
    if (!form.gender) {
      showError("Please select your gender", ["gender"]);
      return;
    }
    if (!form.email.trim()) {
      showError("Email is required", ["email"]);
      return;
    }
    if (!form.email.trim().toLowerCase().endsWith("@aligntech.com")) {
      showError("Only @aligntech.com emails are allowed", ["email"]);
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
      clearSaved();
      onSuccess(form.email);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onChange={clearError}>
      {restored && (
        <div className="bg-brand-500/10 border border-brand-500/20 text-brand-300 px-4 py-3 rounded-xl text-sm flex items-center justify-between">
          <span>Draft restored from your previous session.</span>
          <button type="button" onClick={() => { clearSaved(); setForm(initial); dismiss(); }} className="text-xs font-bold text-brand-400 hover:text-brand-300">Clear Draft</button>
        </div>
      )}
      {error && (
        <div
          key={shakeKey}
          ref={errorRef}
          className="animate-shake bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm flex items-start gap-3"
        >
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Full Name *</label>
          <input
            type="text"
            required
            value={form.fullName}
            onChange={(e) => setForm((prev) => ({ ...prev, fullName: e.target.value }))}
            className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">Email *</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError("email") ? "field-error" : "border-white/10"}`}
            placeholder="name@aligntech.com"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Gender *</label>
        <div className="flex gap-3">
          {GENDERS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, gender: g }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.gender === g
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-dark-500 text-slate-300 border border-white/10 hover:border-brand-400/30"
              }`}
            >
              {g === "MALE" ? "Male" : g === "FEMALE" ? "Female" : "Other"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Preferred Role(s) * <span className="text-slate-500 font-normal">(max 2)</span></label>
        <div className="flex flex-wrap gap-2">
          {ROLES.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => toggleRole(role)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                form.preferredRole.includes(role)
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-dark-500 text-slate-300 border border-white/10 hover:border-brand-400/30"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Experience Level *</label>
        <div className="flex gap-3">
          {LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, experienceLevel: level }))}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                form.experienceLevel === level
                  ? "bg-brand-600 text-white shadow-md"
                  : "bg-dark-500 text-slate-300 border border-white/10 hover:border-brand-400/30"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1">Comments</label>
        <textarea
          value={form.comments}
          onChange={(e) => setForm((prev) => ({ ...prev, comments: e.target.value }))}
          className="w-full px-4 py-2.5 border border-white/10 rounded-xl focus:ring-2 focus:ring-brand-400 focus:border-transparent bg-dark-500 text-slate-100"
          rows={3}
          placeholder="Availability, special requests, etc."
        />
      </div>

      <Button type="submit" loading={loading} size="lg" className={`w-full ${error ? "btn-error-pulse" : ""}`}>
        Register as Individual
      </Button>
    </form>
  );
}
