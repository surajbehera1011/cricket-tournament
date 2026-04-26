"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/manage";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      callbackUrl,
      redirect: false,
    });
    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else if (result?.url) {
      window.location.href = result.url;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative">
      <div className="absolute inset-0 bg-[url('/images/cricket-hero.jpg')] bg-cover bg-center" style={{ filter: "brightness(0.2) saturate(1.2)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-dark-600/90 via-dark-600/50 to-dark-600/70" />
      <div className="relative z-10 max-w-md w-full space-y-8 p-8 dark-card rounded-2xl mx-4">
        <div className="text-center">
          <img src="/images/align-logo.png" alt="Align" className="h-16 w-16 rounded-2xl object-cover mx-auto mb-4 shadow-lg" />
          <h1 className="text-3xl font-bold text-white">Admin / Captain Login</h1>
          <p className="mt-2 text-slate-400">Sign in to manage the tournament</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-pitch-500/50 focus:border-pitch-500/30 bg-dark-400/60 text-white placeholder:text-slate-500"
              placeholder="your.email@company.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-white/[0.06] rounded-xl focus:ring-2 focus:ring-pitch-500/50 focus:border-pitch-500/30 bg-dark-400/60 text-white placeholder:text-slate-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-3 bg-pitch-500 text-white rounded-xl hover:bg-pitch-400 font-bold transition-all disabled:opacity-50 shadow-lg shadow-pitch-500/25"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-500">Loading...</p>
        </div>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
