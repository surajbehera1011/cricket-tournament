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
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tournament Registration</h1>
        <p className="mt-2 text-gray-600">Register your team or sign up as an individual player</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        <button
          onClick={() => setTab("team")}
          className={cn(
            "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
            tab === "team"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Register Team
        </button>
        <button
          onClick={() => setTab("individual")}
          className={cn(
            "flex-1 py-3 rounded-lg text-sm font-medium transition-all",
            tab === "individual"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          )}
        >
          Register Individual
        </button>
      </div>

      <Card>
        <CardContent className="py-6">
          {tab === "team" ? (
            <TeamForm onSuccess={handleSuccess} />
          ) : (
            <IndividualForm onSuccess={handleSuccess} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
