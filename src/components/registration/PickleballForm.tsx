"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";

const CATEGORIES = [
  { value: "MENS_SINGLES", label: "Men's Singles", type: "singles", icon: "🏓" },
  { value: "WOMENS_SINGLES", label: "Women's Singles", type: "singles", icon: "🏓" },
  { value: "MENS_DOUBLES", label: "Men's Doubles", type: "doubles", icon: "🏓🏓" },
  { value: "WOMENS_DOUBLES", label: "Women's Doubles", type: "doubles", icon: "🏓🏓" },
  { value: "MIXED_DOUBLES", label: "Mixed Doubles", type: "doubles", icon: "🏓🏓" },
] as const;

interface PickleballFormProps {
  onSuccess: (email: string) => void;
}

export function PickleballForm({ onSuccess }: PickleballFormProps) {
  const [category, setCategory] = useState("");
  const [player1Name, setPlayer1Name] = useState("");
  const [player1Email, setPlayer1Email] = useState("");
  const [player2Name, setPlayer2Name] = useState("");
  const [player2Email, setPlayer2Email] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorFields, setErrorFields] = useState<Set<string>>(new Set());
  const [shakeKey, setShakeKey] = useState(0);
  const errorRef = useRef<HTMLDivElement>(null);

  const selected = CATEGORIES.find((c) => c.value === category);
  const isDoubles = selected?.type === "doubles";

  const DOMAIN = "@aligntech.com";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setErrorFields(new Set());

    if (!category) {
      showError("Please select a category", ["category"]);
      return;
    }
    if (!player1Name.trim() || !player1Email.trim()) {
      showError("Player 1 name and email are required", [!player1Name.trim() ? "p1-name" : "p1-email"]);
      return;
    }
    if (!player1Email.trim().toLowerCase().endsWith(DOMAIN)) {
      showError(`Only ${DOMAIN} emails are allowed`, ["p1-email"]);
      return;
    }
    if (isDoubles) {
      if (!player2Name.trim() || !player2Email.trim()) {
        showError("Partner name and email are required for doubles", [!player2Name.trim() ? "p2-name" : "p2-email"]);
        return;
      }
      if (!player2Email.trim().toLowerCase().endsWith(DOMAIN)) {
        showError(`Partner email must be an ${DOMAIN} address`, ["p2-email"]);
        return;
      }
      if (player1Email.trim().toLowerCase() === player2Email.trim().toLowerCase()) {
        showError("Both players cannot have the same email", ["p1-email", "p2-email"]);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch("/api/register/pickleball", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          player1Name: player1Name.trim(),
          player1Email: player1Email.trim(),
          ...(isDoubles ? { player2Name: player2Name.trim(), player2Email: player2Email.trim() } : {}),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Registration failed");
      }

      setCategory("");
      setPlayer1Name("");
      setPlayer1Email("");
      setPlayer2Name("");
      setPlayer2Email("");
      onSuccess(player1Email);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" onChange={clearError}>
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

      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-xl text-sm">
        Select your category and fill in the player details. No duplicate entries allowed per category. All emails must be <strong>@aligntech.com</strong> addresses.
      </div>

      {/* Category Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-3">Category *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => {
                setCategory(cat.value);
                if (cat.type === "singles") {
                  setPlayer2Name("");
                  setPlayer2Email("");
                }
              }}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all text-left ${
                category === cat.value
                  ? "bg-emerald-600 text-white shadow-md ring-2 ring-emerald-300"
                  : "bg-dark-500 text-slate-300 border border-white/10 hover:border-emerald-400/30"
              }`}
            >
              <span className="text-lg">{cat.icon}</span>
              <div>
                <span className="block">{cat.label}</span>
                <span className={`text-[10px] ${category === cat.value ? "text-emerald-200" : "text-slate-400"}`}>
                  {cat.type === "singles" ? "1 player" : "2 players"}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {category && (
        <>
          {/* Player 1 */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-emerald-400">
              {isDoubles ? "Player 1" : "Player Details"}
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={player1Name}
                  onChange={(e) => setPlayer1Name(e.target.value)}
                  className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={player1Email}
                  onChange={(e) => setPlayer1Email(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError("p1-email") ? "field-error" : "border-white/10"}`}
                  placeholder="name@aligntech.com"
                />
              </div>
            </div>
          </div>

          {/* Player 2 (doubles only) */}
          {isDoubles && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-semibold text-violet-400">Player 2 (Partner)</h3>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={player2Name}
                    onChange={(e) => setPlayer2Name(e.target.value)}
                    className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-dark-500 text-slate-100"
                    placeholder="Partner full name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={player2Email}
                    onChange={(e) => setPlayer2Email(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-dark-500 text-slate-100 ${isFieldError("p2-email") ? "field-error" : "border-white/10"}`}
                    placeholder="partner@aligntech.com"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Button type="submit" loading={loading} size="lg" className={`w-full ${error ? "btn-error-pulse" : ""}`}>
        Register for Pickleball
      </Button>
    </form>
  );
}
