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

function RegisterContent() {
  const searchParams = useSearchParams();
  const sportParam = searchParams.get("sport");
  const initialSport: Sport = sportParam === "pickleball" ? "pickleball" : "cricket";

  const [sport, setSport] = useState<Sport>(initialSport);
  const [cricketTab, setCricketTab] = useState<CricketTab>("team");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((s) => setRegistrationOpen(s.registrationOpen ?? true))
      .catch(() => setRegistrationOpen(true));
  }, []);

  const handleCricketSuccess = () => {
    toast(
      cricketTab === "team"
        ? "Team registration submitted! It will appear on the dashboard after admin approval."
        : "Individual registration submitted! You will appear in the player pool after admin approval.",
      "success"
    );
  };

  const handlePickleballSuccess = () => {
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
        ) : (
          <>
            {/* Sport Selector */}
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
