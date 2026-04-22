"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/Card";
import { TeamForm } from "@/components/registration/TeamForm";
import { IndividualForm } from "@/components/registration/IndividualForm";
import { cn } from "@/lib/utils";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab] = useState<"team" | "individual">("team");
  const [success, setSuccess] = useState("");

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cricket-600" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Sign In Required</h1>
        <p className="mt-2 text-gray-600">Please sign in to register for the tournament.</p>
      </div>
    );
  }

  const handleSuccess = () => {
    setSuccess(
      tab === "team"
        ? "Team registered successfully! Redirecting to dashboard..."
        : "Individual registration successful! Redirecting to dashboard..."
    );
    // Wait 1.5s then redirect to dashboard so Neon DB replication catches up
    setTimeout(() => {
      router.push("/?_t=" + Date.now());
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Tournament Registration</h1>
        <p className="mt-2 text-gray-600">Register your team or sign up as an individual player</p>
      </div>

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
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
