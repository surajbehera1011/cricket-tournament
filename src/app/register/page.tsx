"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { TeamForm } from "@/components/registration/TeamForm";
import { IndividualForm } from "@/components/registration/IndividualForm";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [tab, setTab] = useState<"team" | "individual">("team");
  const [registrationOpen, setRegistrationOpen] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetch("/api/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((s) => setRegistrationOpen(s.registrationOpen ?? true))
      .catch(() => setRegistrationOpen(true));
  }, []);

  const handleSuccess = () => {
    toast(
      tab === "team"
        ? "Team registration submitted! It will appear on the dashboard after admin approval."
        : "Individual registration submitted! You will appear in the player pool after admin approval.",
      "success"
    );
  };

  return (
    <div>
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="text-5xl mb-4 block">🏏</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Join the Align Cricket Tournament
          </h1>
          <p className="mt-3 text-white/70 max-w-md mx-auto">
            Register your team or sign up as an individual player for the tournament
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
            {/* Tab switcher */}
            <div className="flex gap-1 bg-white p-1.5 rounded-2xl mb-5 shadow-lg border border-brand-100/50">
              <button
                onClick={() => setTab("team")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  tab === "team"
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-500 hover:text-brand-700 hover:bg-brand-50"
                )}
              >
                <span className="text-lg">👥</span>
                Register Team
              </button>
              <button
                onClick={() => setTab("individual")}
                className={cn(
                  "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                  tab === "individual"
                    ? "bg-brand-600 text-white shadow-md"
                    : "text-slate-500 hover:text-brand-700 hover:bg-brand-50"
                )}
              >
                <span className="text-lg">👤</span>
                Register Individual
              </button>
            </div>

            <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
              <CardContent className="py-8 px-6 sm:px-8">
                {tab === "team" ? (
                  <TeamForm onSuccess={handleSuccess} />
                ) : (
                  <IndividualForm onSuccess={handleSuccess} />
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
