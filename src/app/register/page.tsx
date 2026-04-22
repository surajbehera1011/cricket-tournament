"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { TeamForm } from "@/components/registration/TeamForm";
import { IndividualForm } from "@/components/registration/IndividualForm";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const [tab, setTab] = useState<"team" | "individual">("team");
  const [success, setSuccess] = useState("");

  const handleSuccess = () => {
    setSuccess(
      tab === "team"
        ? "Team registration submitted! It will appear on the dashboard after admin approval."
        : "Individual registration submitted! You will appear in the player pool after admin approval."
    );
    setTimeout(() => setSuccess(""), 8000);
  };

  return (
    <div>
      {/* Hero */}
      <div className="cricket-hero cricket-field-pattern">
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20 text-center">
          <span className="text-5xl mb-4 block">🏏</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Join the Align Cricket Tournament
          </h1>
          <p className="mt-3 text-cricket-200/80 max-w-md mx-auto">
            Register your team or sign up as an individual player for the tournament
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-12">
        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
            <span className="text-lg">✅</span>
            {success}
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex gap-1 bg-white p-1.5 rounded-2xl mb-5 shadow-lg border border-gray-100">
          <button
            onClick={() => setTab("team")}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
              tab === "team"
                ? "bg-cricket-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
                ? "bg-cricket-600 text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
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
      </div>
    </div>
  );
}
