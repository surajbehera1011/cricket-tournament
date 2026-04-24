"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

function useReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function Section({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, visible } = useReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"} ${className}`}
    >
      {children}
    </div>
  );
}

function StepCard({ number, icon, title, desc, color }: {
  number: number; icon: string; title: string; desc: string; color: string;
}) {
  return (
    <div className={`relative rounded-2xl border-2 ${color} p-5 bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group`}>
      <span className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-brand-600 text-white text-xs font-black flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
        {number}
      </span>
      <span className="text-3xl mb-3 block">{icon}</span>
      <h4 className="text-sm font-bold text-slate-800 mb-1">{title}</h4>
      <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
    </div>
  );
}

function StatusPill({ label, color, dot }: { label: string; color: string; dot: string }) {
  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${color}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`} />
      {label}
    </div>
  );
}

export default function GuidePage() {
  const [activeTeamState, setActiveTeamState] = useState(0);

  const teamStates = [
    { status: "Pending Approval", icon: "⏳", color: "bg-amber-50 border-amber-200 text-amber-700", dot: "bg-amber-400 animate-pulse", desc: "You just registered. Admin will review your team." },
    { status: "In Progress", icon: "🔧", color: "bg-blue-50 border-blue-200 text-blue-700", dot: "bg-blue-400", desc: "Approved! Captain can now add/remove players via draft." },
    { status: "Submitted", icon: "📋", color: "bg-brand-50 border-brand-200 text-brand-700", dot: "bg-brand-400", desc: "Captain submitted the roster. Waiting for final admin approval." },
    { status: "Ready (Frozen)", icon: "✅", color: "bg-emerald-50 border-emerald-200 text-emerald-700", dot: "bg-emerald-400", desc: "Admin approved! Roster is locked. You're in the tournament!" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTeamState((prev) => (prev + 1) % teamStates.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [teamStates.length]);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="hero-section">
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 mb-6 animate-bounce-slow">
            <span className="text-sm">📖</span>
            <span className="text-sm text-white/90 font-medium">Everything you need to know</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            How It All Works
          </h1>
          <p className="mt-4 text-lg text-white/70 max-w-xl mx-auto">
            Your complete guide to the Align Sports League — from registration to match day.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link href="/register" className="px-6 py-3 bg-white text-brand-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
              Register Now
            </Link>
            <Link href="/" className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-xl text-sm font-bold hover:bg-white/25 transition-all backdrop-blur-sm">
              View Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20 pb-16 space-y-16">

        {/* Quick Overview */}
        <Section>
          <div className="bg-white rounded-2xl shadow-xl border border-brand-100/50 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-800 mb-2 text-center">Two Sports, One Platform</h2>
            <p className="text-sm text-slate-400 text-center mb-6">Register, track, and compete — all in one place.</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-gradient-to-br from-brand-50 to-violet-50 border border-brand-200/50 p-6 text-center hover:shadow-md transition-all">
                <span className="text-5xl mb-3 block">🏏</span>
                <h3 className="text-lg font-bold text-brand-700">Cricket</h3>
                <p className="text-xs text-slate-500 mt-1">Register as a team or individually. Get drafted. Compete in round-robin matches.</p>
              </div>
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50 p-6 text-center hover:shadow-md transition-all">
                <span className="text-5xl mb-3 block">🏓</span>
                <h3 className="text-lg font-bold text-emerald-700">Pickleball</h3>
                <p className="text-xs text-slate-500 mt-1">5 categories — singles & doubles. Register your pair and get on the court.</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Cricket Registration Flow */}
        <Section>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-brand-600 bg-brand-50 border border-brand-200 rounded-full px-3 py-1 mb-3 uppercase tracking-widest">Cricket</span>
            <h2 className="text-2xl font-extrabold text-slate-800">Registration Flow</h2>
            <p className="text-sm text-slate-400 mt-1">Two ways to join the cricket tournament</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            {/* Team Registration */}
            <div className="bg-white rounded-2xl border border-brand-100/50 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-brand-400 to-brand-600" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-brand-100 text-brand-600 flex items-center justify-center text-sm">👥</span>
                  Register a Team
                </h3>
                <div className="space-y-3">
                  <StepCard number={1} icon="✏️" title="Fill the form" desc="Team name, color, captain details, and at least 3 more players (min 4 total)." color="border-brand-100" />
                  <StepCard number={2} icon="⏳" title="Await approval" desc="Admin reviews your team. You'll see 'Pending' on the dashboard." color="border-amber-100" />
                  <StepCard number={3} icon="🔧" title="Build your roster" desc="Once approved, captain can draft more players from the pool (up to 9)." color="border-blue-100" />
                  <StepCard number={4} icon="📋" title="Submit roster" desc="When your team meets all criteria, captain submits for final review." color="border-violet-100" />
                  <StepCard number={5} icon="✅" title="Ready to play!" desc="Admin approves — team is frozen and scheduled for matches." color="border-emerald-100" />
                </div>
              </div>
            </div>

            {/* Individual Registration */}
            <div className="bg-white rounded-2xl border border-brand-100/50 shadow-sm overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-violet-400 to-violet-600" />
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-sm">👤</span>
                  Register as Individual
                </h3>
                <div className="space-y-3">
                  <StepCard number={1} icon="✏️" title="Fill the form" desc="Your name, email, gender, preferred role (Batsman, Bowler, etc.), and experience level." color="border-violet-100" />
                  <StepCard number={2} icon="⏳" title="Await approval" desc="Admin reviews. You'll appear in the 'Awaiting Approval' section on the dashboard." color="border-amber-100" />
                  <StepCard number={3} icon="🏊" title="Enter the player pool" desc="Once approved, you're visible in the pool. Captains and admins can see your profile." color="border-blue-100" />
                  <StepCard number={4} icon="🤝" title="Get drafted!" desc="A captain picks you for their team. You're now a 'Draft Pick' on that roster." color="border-emerald-100" />
                </div>
                <div className="mt-4 bg-violet-50 border border-violet-200 rounded-xl p-3">
                  <p className="text-xs text-violet-700"><strong>Tip:</strong> Don't have a team? No problem! Register individually and captains will find you.</p>
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Team States - Animated */}
        <Section>
          <div className="bg-white rounded-2xl shadow-xl border border-brand-100/50 p-6 sm:p-8">
            <h2 className="text-xl font-extrabold text-slate-800 mb-1 text-center">Team Lifecycle</h2>
            <p className="text-sm text-slate-400 text-center mb-6">Every team progresses through these stages</p>

            <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
              {teamStates.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTeamState(i)}
                  className={`transition-all duration-300 ${i === activeTeamState ? "scale-110" : "scale-100 opacity-60 hover:opacity-80"}`}
                >
                  <StatusPill label={s.status} color={s.color} dot={s.dot} />
                </button>
              ))}
            </div>

            {/* Animated state detail */}
            <div className="relative h-28 overflow-hidden">
              {teamStates.map((s, i) => (
                <div
                  key={i}
                  className={`absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-500 ${
                    i === activeTeamState ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none"
                  }`}
                >
                  <span className="text-4xl mb-2">{s.icon}</span>
                  <p className="text-sm text-slate-600 max-w-md">{s.desc}</p>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="flex items-center gap-1 mt-4">
              {teamStates.map((_, i) => (
                <div key={i} className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      i <= activeTeamState ? "bg-brand-500 w-full" : "bg-transparent w-0"
                    }`}
                  />
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Pickleball Section */}
        <Section>
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1 mb-3 uppercase tracking-widest">Pickleball</span>
            <h2 className="text-2xl font-extrabold text-slate-800">Pickleball Registration</h2>
            <p className="text-sm text-slate-400 mt-1">5 categories, simple flow</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-emerald-100/50 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-6 sm:p-8">
              {/* Categories Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6">
                {[
                  { label: "Men's Singles", icon: "🏓", bg: "bg-sky-50 border-sky-200 text-sky-700" },
                  { label: "Women's Singles", icon: "🏓", bg: "bg-pink-50 border-pink-200 text-pink-700" },
                  { label: "Men's Doubles", icon: "🏓🏓", bg: "bg-blue-50 border-blue-200 text-blue-700" },
                  { label: "Women's Doubles", icon: "🏓🏓", bg: "bg-fuchsia-50 border-fuchsia-200 text-fuchsia-700" },
                  { label: "Mixed Doubles", icon: "🏓🏓", bg: "bg-violet-50 border-violet-200 text-violet-700" },
                ].map((cat) => (
                  <div key={cat.label} className={`rounded-xl border p-3 text-center ${cat.bg}`}>
                    <span className="text-lg block">{cat.icon}</span>
                    <p className="text-[10px] font-bold mt-1 leading-tight">{cat.label}</p>
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <StepCard number={1} icon="🏓" title="Pick a category" desc="Singles (1 player) or Doubles (2 players). Choose the one that fits you." color="border-emerald-100" />
                <StepCard number={2} icon="⏳" title="Await approval" desc="Admin reviews. You'll see 'Pending' on the pickleball dashboard." color="border-amber-100" />
                <StepCard number={3} icon="📅" title="Get scheduled" desc="Once approved, you're in! Fixtures are auto-generated for your category." color="border-emerald-100" />
              </div>
            </div>
          </div>
        </Section>

        {/* Key Features Grid */}
        <Section>
          <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-6">Key Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { icon: "📊", title: "Live Dashboard", desc: "Real-time stats, team cards, and player pool. Auto-updates via live events.", bg: "from-brand-50 to-violet-50" },
              { icon: "📋", title: "Status Tracker", desc: "Enter your email anytime to check if your registration is approved.", bg: "from-amber-50 to-orange-50" },
              { icon: "📅", title: "Auto Fixtures", desc: "Round-robin schedules generated automatically once teams are ready.", bg: "from-emerald-50 to-teal-50" },
              { icon: "👨‍✈️", title: "Captain Portal", desc: "Captains log in to manage their roster — draft players, submit team.", bg: "from-blue-50 to-sky-50" },
              { icon: "🖥️", title: "TV Mode", desc: "Add ?tv=true to the dashboard URL for large-screen display at events.", bg: "from-slate-50 to-gray-100" },
              { icon: "🔍", title: "Search Everything", desc: "Find teams, players, or pickleball entries instantly on the dashboard.", bg: "from-pink-50 to-rose-50" },
            ].map((f) => (
              <div key={f.title} className={`bg-gradient-to-br ${f.bg} rounded-2xl border border-white/50 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300`}>
                <span className="text-2xl mb-2 block">{f.icon}</span>
                <h3 className="text-sm font-bold text-slate-800">{f.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Captain & Admin Roles */}
        <Section>
          <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-6">Who Does What?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-brand-100/50 shadow-sm p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 text-2xl flex items-center justify-center mx-auto mb-3">🙋</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Players</h3>
              <ul className="text-xs text-slate-500 space-y-1.5 text-left">
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Register (team or individual)</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> Check registration status</li>
                <li className="flex items-start gap-2"><span className="text-emerald-500 mt-0.5">&#10003;</span> View dashboard & schedule</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-blue-100/50 shadow-sm p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-2xl flex items-center justify-center mx-auto mb-3">👨‍✈️</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Captains</h3>
              <ul className="text-xs text-slate-500 space-y-1.5 text-left">
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">&#10003;</span> Everything players can do</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">&#10003;</span> Draft players from the pool</li>
                <li className="flex items-start gap-2"><span className="text-blue-500 mt-0.5">&#10003;</span> Manage & submit team roster</li>
              </ul>
            </div>
            <div className="bg-white rounded-2xl border border-violet-100/50 shadow-sm p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-violet-50 text-2xl flex items-center justify-center mx-auto mb-3">🛡️</div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">Admins</h3>
              <ul className="text-xs text-slate-500 space-y-1.5 text-left">
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">&#10003;</span> Approve / reject registrations</li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">&#10003;</span> Create captain accounts</li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">&#10003;</span> Configure tournament settings</li>
                <li className="flex items-start gap-2"><span className="text-violet-500 mt-0.5">&#10003;</span> Freeze teams & generate schedule</li>
              </ul>
            </div>
          </div>
        </Section>

        {/* FAQ */}
        <Section>
          <h2 className="text-2xl font-extrabold text-slate-800 text-center mb-6">Common Questions</h2>
          <div className="space-y-3">
            {[
              { q: "I registered but can't see my name on the dashboard?", a: "All registrations need admin approval first. Check your status on the Status page using your email. You'll also see yourself in the 'Awaiting Approval' section at the bottom of the dashboard." },
              { q: "What's the minimum team size?", a: "You need at least 4 players (including captain) to register. The full team size is 9 — remaining slots can be filled later via the player draft." },
              { q: "Do I need a full team to register?", a: "No! Register with at least 4 players. Your captain can draft more players from the individual pool after approval." },
              { q: "What does 'Frozen' mean?", a: "When admin marks a team as Ready, it becomes frozen — no more roster changes allowed. This means you're confirmed for the tournament." },
              { q: "I registered individually. Now what?", a: "Once approved, you'll appear in the Player Pool. Captains will browse the pool and draft you into their team." },
              { q: "Can I play both cricket and pickleball?", a: "Yes! Register separately for each sport. They're tracked independently." },
              { q: "How are matches scheduled?", a: "Fixtures are auto-generated as round-robin once enough teams/entries are approved. Check the Schedule page." },
            ].map((faq, i) => (
              <details key={i} className="group bg-white rounded-2xl border border-brand-100/50 shadow-sm overflow-hidden">
                <summary className="flex items-center justify-between px-6 py-4 cursor-pointer hover:bg-brand-50/30 transition-colors">
                  <span className="text-sm font-semibold text-slate-800 pr-4">{faq.q}</span>
                  <span className="text-brand-400 text-lg flex-shrink-0 group-open:rotate-45 transition-transform duration-200">+</span>
                </summary>
                <div className="px-6 pb-4">
                  <p className="text-sm text-slate-500 leading-relaxed">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </Section>

        {/* CTA Footer */}
        <Section>
          <div className="bg-gradient-to-r from-brand-600 to-violet-600 rounded-2xl p-8 sm:p-10 text-center shadow-xl">
            <h2 className="text-2xl font-extrabold text-white mb-2">Ready to Play?</h2>
            <p className="text-white/70 text-sm mb-6 max-w-md mx-auto">
              Register now and join the Align Sports League. It takes less than 2 minutes.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/register" className="px-6 py-3 bg-white text-brand-700 rounded-xl text-sm font-bold hover:bg-white/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                Register Now
              </Link>
              <Link href="/status" className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-xl text-sm font-bold hover:bg-white/25 transition-all">
                Check Status
              </Link>
              <Link href="/" className="px-6 py-3 bg-white/15 text-white border border-white/25 rounded-xl text-sm font-bold hover:bg-white/25 transition-all">
                Dashboard
              </Link>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}
