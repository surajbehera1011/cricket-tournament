"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { TeamForm } from "@/components/registration/TeamForm";
import { IndividualForm } from "@/components/registration/IndividualForm";
import { PickleballForm } from "@/components/registration/PickleballForm";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

type Sport = "cricket" | "pickleball";
type CricketTab = "team" | "individual";

interface SuccessState {
  sport: Sport;
  type: string;
  email: string;
}

function SuccessPanel({ success, onRegisterAnother }: { success: SuccessState; onRegisterAnother: () => void }) {
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-brand-100/50 overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500" />
      <div className="p-8 text-center">
        <span className="text-5xl mb-4 block">✅</span>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Registration Submitted!</h2>
        <p className="text-slate-500 max-w-md mx-auto mb-6">
          Your {success.sport === "cricket" ? `cricket ${success.type}` : "pickleball"} registration has been received
          and is <strong className="text-amber-600">pending admin approval</strong>.
          You&apos;ll appear on the dashboard once approved.
        </p>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 max-w-sm mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-sm font-bold text-amber-700">Status: Pending Approval</span>
          </div>
          <p className="text-xs text-amber-600">Admin will review your registration shortly.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href={`/status?email=${encodeURIComponent(success.email)}`}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Check Registration Status
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
          >
            View Dashboard
          </a>
          <button
            onClick={onRegisterAnother}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-brand-600 rounded-xl text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            Register Another
          </button>
        </div>
      </div>
    </div>
  );
}

function RegisterContent() {
  const searchParams = useSearchParams();
  const sportParam = searchParams.get("sport");
  const initialSport: Sport = sportParam === "pickleball" ? "pickleball" : "cricket";

  const [sport, setSport] = useState<Sport>(initialSport);
  const [cricketTab, setCricketTab] = useState<CricketTab>("team");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((s) => setRegistrationOpen(s.registrationOpen ?? true))
      .catch(() => setRegistrationOpen(true));
  }, []);

  const handleCricketSuccess = (email: string) => {
    setSuccess({ sport: "cricket", type: cricketTab, email });
    toast(
      cricketTab === "team"
        ? "Team registration submitted! It will appear on the dashboard after admin approval."
        : "Individual registration submitted! You will appear in the player pool after admin approval.",
      "success"
    );
  };

  const handlePickleballSuccess = (email: string) => {
    setSuccess({ sport: "pickleball", type: "pickleball", email });
    toast("Pickleball registration submitted! Awaiting admin approval.", "success");
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="text-5xl mb-4 block">{sport === "cricket" ? "🏏" : "🏓"}</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {sport === "cricket" ? "Cricket Registration" : "Pickleball Registration"}
          </h1>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            {sport === "cricket"
              ? "Register your team or sign up as an individual player"
              : "Register for a pickleball category"}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
        {registrationOpen === false ? (
          <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
            <CardContent className="py-16 px-6 sm:px-8 text-center">
              <span className="text-5xl mb-4 block">🚫</span>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">Registrations Closed</h2>
              <p className="text-slate-500 max-w-md mx-auto">
                Registration for the tournament is currently closed. Please contact the organizer for more information.
              </p>
              <a href="mailto:sbehera@aligntech.com" className="inline-block mt-4 text-sm text-brand-600 hover:text-brand-700 font-medium">
                Contact: sbehera@aligntech.com
              </a>
            </CardContent>
          </Card>
        ) : success ? (
          <SuccessPanel success={success} onRegisterAnother={() => setSuccess(null)} />
        ) : (
          <>
            {/* Already registered hint */}
            <div className="bg-brand-50 border border-brand-200/50 rounded-2xl px-4 py-3 mb-5 flex items-center justify-between gap-3">
              <p className="text-xs text-brand-700">
                <span className="font-bold">Already registered?</span>{" "}
                Check if your registration has been approved.
              </p>
              <a
                href="/status"
                className="text-xs font-bold text-brand-600 hover:text-brand-800 whitespace-nowrap transition-colors"
              >
                Check Status &rarr;
              </a>
            </div>

            <div className="flex gap-1 bg-white p-1.5 rounded-2xl mb-5 shadow-lg border border-brand-100/50">
              <button
                onClick={() => setSport("cricket")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  sport === "cricket"
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-500 hover:text-brand-700 hover:bg-brand-50"
                )}
              >
                <span className="text-lg">🏏</span>
                Cricket
              </button>
              <button
                onClick={() => setSport("pickleball")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  sport === "pickleball"
                    ? "bg-emerald-600 text-white shadow-md"
                    : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50"
                )}
              >
                <span className="text-lg">🏓</span>
                Pickleball
              </button>
            </div>

            {sport === "cricket" && (
              <>
                {/* Cricket sub-tabs */}
                <div className="flex gap-1 bg-white p-1 rounded-xl mb-5 shadow-sm border border-brand-100/30">
                  <button
                    onClick={() => setCricketTab("team")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      cricketTab === "team"
                        ? "bg-brand-100 text-brand-700"
                        : "text-slate-400 hover:text-brand-600"
                    )}
                  >
                    <span>👥</span> Register Team
                  </button>
                  <button
                    onClick={() => setCricketTab("individual")}
                    className={cn(
                      "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2",
                      cricketTab === "individual"
                        ? "bg-brand-100 text-brand-700"
                        : "text-slate-400 hover:text-brand-600"
                    )}
                  >
                    <span>👤</span> Register Individual
                  </button>
                </div>

                <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
                  <CardContent className="py-8 px-6 sm:px-8">
                    {cricketTab === "team" ? (
                      <TeamForm onSuccess={handleCricketSuccess} />
                    ) : (
                      <IndividualForm onSuccess={handleCricketSuccess} />
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {sport === "pickleball" && (
              <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
                <CardContent className="py-8 px-6 sm:px-8">
                  <PickleballForm onSuccess={handlePickleballSuccess} />
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-200 border-t-brand-600 mx-auto" />
        </div>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
