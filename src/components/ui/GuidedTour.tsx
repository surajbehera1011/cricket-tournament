"use client";

import { useState, useEffect, useCallback } from "react";

interface TourStep {
  icon: string;
  title: string;
  description: string;
  details?: string[];
  highlight?: "register" | "status" | "dashboard" | "captain";
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: "👋",
    title: "Welcome to Align Sports League",
    description:
      "This is your one-stop platform for the Align Technology internal sports tournament. Let's walk you through everything you need to know in under 2 minutes.",
    details: [
      "Two sports: Cricket & Pickleball",
      "Register, track progress, and follow the action live",
      "Open to all employees across various teams",
    ],
  },
  {
    icon: "🏏",
    title: "Step 1: Pick Your Sport",
    description:
      "Start by choosing between Cricket and Pickleball. You can register for both — they're tracked independently.",
    details: [
      "Cricket — Team-based (register a team or join as an individual)",
      "Pickleball — 5 categories (Men's/Women's Singles & Doubles, Mixed Doubles)",
      "Use the sport toggle on the Register page to switch",
    ],
    highlight: "register",
  },
  {
    icon: "👥",
    title: "Cricket: Register a Team",
    description:
      "Captains can register a full team with a minimum of 4 players. Here's how it works:",
    details: [
      "Fill out team name, team color, and captain details",
      "Add at least 3 other players (name, email, gender, role)",
      "Minimum 4 players to start, 8 mandatory to submit (max 10 with extras)",
      "After submission, your team enters 'Pending Approval' state",
    ],
    highlight: "register",
  },
  {
    icon: "👤",
    title: "Cricket: Register as Individual",
    description:
      "Don't have a team? No problem! Register yourself and get drafted by a captain.",
    details: [
      "Provide your name, email, gender, preferred role, and experience level",
      "You'll enter the Player Pool once approved",
      "Captains browse the pool and draft players into their teams",
      "You'll be notified when you get picked",
    ],
    highlight: "register",
  },
  {
    icon: "🏓",
    title: "Pickleball Registration",
    description:
      "Pickleball registration is simpler — pick a category and register directly.",
    details: [
      "5 categories: Men's Singles, Women's Singles, Men's Doubles, Women's Doubles, Mixed Doubles",
      "For Singles: just enter your details",
      "For Doubles: enter both partner details",
      "Each registration is approved by admin separately",
    ],
    highlight: "register",
  },
  {
    icon: "⏳",
    title: "Step 2: Wait for Admin Approval",
    description:
      "All registrations go through admin review. Here's what happens after you submit:",
    details: [
      "Your registration status becomes 'Pending Approval'",
      "Admin reviews and either approves or rejects",
      "Once approved, teams appear on the dashboard; individuals enter the pool",
      "You can check your status anytime using your email on the Status page",
    ],
    highlight: "status",
  },
  {
    icon: "🔧",
    title: "Captain Workflow: Build Your Roster",
    description:
      "After team approval, captains get access to the Manage Teams portal to build the perfect squad.",
    details: [
      "Sign in with your captain credentials (provided by admin)",
      "View your team and current roster",
      "Browse the Individual Player Pool",
      "Draft players to fill remaining slots (8 mandatory + up to 2 extra)",
      "Remove draft picks if needed — originals can't be removed",
    ],
    highlight: "captain",
  },
  {
    icon: "📋",
    title: "Captain Workflow: Submit Roster",
    description:
      "Once your team is ready, submit the roster for final admin approval.",
    details: [
      "Your team must meet all criteria (8 mandatory players, at least 1 female, etc.)",
      "Click 'Submit Roster' — status changes to 'Submitted'",
      "Admin does a final review",
      "Once approved, roster is FROZEN — no more changes allowed",
      "Your team is now 'Ready' and will be scheduled for matches",
    ],
    highlight: "captain",
  },
  {
    icon: "📊",
    title: "The Live Dashboard",
    description:
      "The dashboard is your real-time window into the tournament. Everything updates live!",
    details: [
      "See all teams, their roster progress, and status at a glance",
      "Browse the Individual Player Pool",
      "Search for any team, player, or captain instantly",
      "Pickleball tab shows all categories and registrations",
      "TV Mode: add ?tv=true for large-screen display at events",
    ],
    highlight: "dashboard",
  },
  {
    icon: "📅",
    title: "Matches & Schedule",
    description:
      "Once enough teams are ready, fixtures are auto-generated as round-robin.",
    details: [
      "Check the Schedule page for match fixtures",
      "Cricket: round-robin format between approved teams",
      "Pickleball: category-wise brackets",
      "Fixtures update automatically as new teams become ready",
    ],
  },
  {
    icon: "🚀",
    title: "You're All Set!",
    description:
      "That's everything! Ready to jump in? Here's a quick cheat sheet:",
    details: [
      "🏏 Register → Wait for approval → Captain drafts → Submit roster → Play!",
      "🏓 Register for Pickleball → Approval → Get scheduled",
      "📋 Check Status anytime with your email",
      "📊 Dashboard tracks everything live",
      "❓ Questions? Email sbehera@aligntech.com",
    ],
  },
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuidedTour({ isOpen, onClose }: GuidedTourProps) {
  const [step, setStep] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const total = TOUR_STEPS.length;
  const current = TOUR_STEPS[step];

  useEffect(() => {
    if (isOpen) {
      setStep(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const goTo = useCallback(
    (nextStep: number, dir: "next" | "prev") => {
      if (animating) return;
      setAnimating(true);
      setDirection(dir);
      setTimeout(() => {
        setStep(nextStep);
        setAnimating(false);
      }, 200);
    },
    [animating]
  );

  const next = () => {
    if (step < total - 1) goTo(step + 1, "next");
    else handleClose();
  };
  const prev = () => {
    if (step > 0) goTo(step - 1, "prev");
  };

  const handleClose = () => {
    localStorage.setItem("asl-tour-completed", "1");
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") next();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  if (!isOpen) return null;

  const progress = ((step + 1) / total) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Tour Card */}
      <div className="relative w-full max-w-lg bg-dark-400 border border-white/[0.08] rounded-3xl shadow-2xl shadow-black/40 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-white/[0.04]">
          <div
            className="h-full bg-gradient-to-r from-pitch-500 to-pitch-400 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step counter + close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <span className="text-xs text-slate-500 font-semibold tracking-wider uppercase">
            {step + 1} of {total}
          </span>
          <button
            onClick={handleClose}
            className="text-slate-500 hover:text-white text-sm font-medium hover:bg-white/[0.06] px-2.5 py-1 rounded-lg transition-colors"
          >
            Skip Tour
          </button>
        </div>

        {/* Content */}
        <div
          className={`px-6 pb-2 transition-all duration-200 ${
            animating
              ? direction === "next"
                ? "opacity-0 translate-x-4"
                : "opacity-0 -translate-x-4"
              : "opacity-100 translate-x-0"
          }`}
        >
          <div className="text-center mb-4">
            <span className="text-5xl block mb-3">{current.icon}</span>
            <h2 className="text-xl font-extrabold text-white leading-tight">
              {current.title}
            </h2>
          </div>

          <p className="text-sm text-slate-300 text-center leading-relaxed mb-4">
            {current.description}
          </p>

          {current.details && (
            <div className="bg-white/[0.03] rounded-2xl border border-white/[0.04] p-4 space-y-2.5 max-h-[200px] overflow-y-auto">
              {current.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-pitch-500/15 text-pitch-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    {detail.startsWith("🏏") || detail.startsWith("🏓") || detail.startsWith("📋") || detail.startsWith("📊") || detail.startsWith("❓")
                      ? ""
                      : i + 1}
                  </span>
                  <p className="text-sm text-slate-400 leading-relaxed">{detail}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 py-5">
          <button
            onClick={prev}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-lg hover:bg-white/[0.06]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          {/* Step dots */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i, i > step ? "next" : "prev")}
                className={`transition-all duration-300 rounded-full ${
                  i === step
                    ? "w-6 h-2 bg-pitch-500"
                    : i < step
                    ? "w-2 h-2 bg-pitch-500/40 hover:bg-pitch-500/60"
                    : "w-2 h-2 bg-white/10 hover:bg-white/20"
                }`}
              />
            ))}
          </div>

          <button
            onClick={next}
            className="flex items-center gap-1.5 text-sm font-bold text-white bg-pitch-500 hover:bg-pitch-400 px-4 py-2 rounded-lg shadow-lg shadow-pitch-500/25 transition-all hover:-translate-y-0.5"
          >
            {step === total - 1 ? "Get Started" : "Next"}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
