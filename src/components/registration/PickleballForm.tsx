"use client";

import { useState } from "react";
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

  const selected = CATEGORIES.find((c) => c.value === category);
  const isDoubles = selected?.type === "doubles";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!category) {
      setError("Please select a category");
      return;
    }
    if (!player1Name.trim() || !player1Email.trim()) {
      setError("Player 1 name and email are required");
      return;
    }
    const DOMAIN = "@aligntech.com";
    if (!player1Email.trim().toLowerCase().endsWith(DOMAIN)) {
      setError(`Only ${DOMAIN} emails are allowed`);
      return;
    }
    if (isDoubles) {
      if (!player2Name.trim() || !player2Email.trim()) {
        setError("Partner name and email are required for doubles");
        return;
      }
      if (!player2Email.trim().toLowerCase().endsWith(DOMAIN)) {
        setError(`Partner email must be an ${DOMAIN} address`);
        return;
      }
      if (player1Email.trim().toLowerCase() === player2Email.trim().toLowerCase()) {
        setError("Both players cannot have the same email");
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
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
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
                  className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-emerald-400 focus:border-transparent bg-dark-500 text-slate-100"
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
                    className="w-full px-3 py-2 border border-white/10 rounded-xl text-sm focus:ring-2 focus:ring-violet-400 focus:border-transparent bg-dark-500 text-slate-100"
                    placeholder="partner@aligntech.com"
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}

      <Button type="submit" loading={loading} size="lg" className="w-full">
        Register for Pickleball
      </Button>
    </form>
  );
}
