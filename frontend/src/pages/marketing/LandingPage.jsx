import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Activity, ClipboardList, LineChart, Pill, Award, Users,
  ShieldCheck, Building2, ArrowRight, Plus, Sparkles, Heart,
  ChevronDown, CheckCircle2, AlertTriangle, AlertCircle, Quote, Star
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { HOME_PATH_BY_ROLE } from "../../config/navConfig.js";

const FEATURES = [
  {
    icon: ClipboardList,
    title: "Daily logging, made simple",
    body: "Glucose, insulin, meals, and activity — logged in seconds, organized into one daily view.",
  },
  {
    icon: LineChart,
    title: "Glucose trends & insights",
    body: "Time-in-range, averages, and standard clinical metrics like GMI, tracked over 7, 14, 30, or 90 days.",
  },
  {
    icon: Pill,
    title: "Medications & adherence",
    body: "Schedules, reminders, and an adherence score that shows exactly how consistent the week has been.",
  },
  {
    icon: ShieldCheck,
    title: "Rule-based alerts",
    body: "Out-of-range readings are flagged immediately using fixed clinical thresholds — a monitoring tool, not a diagnosis.",
  },
  {
    icon: Award,
    title: "Streaks & badges",
    body: "Daily logging is rewarded for consistency and completeness, not volume — built to support real adherence.",
  },
  {
    icon: Users,
    title: "Built for care teams",
    body: "Doctors see their assigned patients' trends and alerts in one dashboard, scoped to their own hospital.",
  },
];

const STEPS = [
  { step: "01", title: "Log", body: "Record glucose, insulin, meals, and activity throughout the day." },
  { step: "02", title: "Track", body: "See trends, streaks, and adherence build up automatically over time." },
  { step: "03", title: "Share", body: "Your care team sees the same data, in real time, between visits." },
];

const FAQS = [
  {
    q: "How does the doctor integration work?",
    a: "Your doctor creates a practitioner account scoped to their clinic/hospital. Once your account is linked using the unique Hospital ID, they can view your glucose charts, insulin dosing, and daily logs in real-time, streamlining review during checkups."
  },
  {
    q: "What clinical guidelines does this follow?",
    a: "DiabetesCare adheres to standards set by the ADA and ISPAD. The target range is fixed at 70–180 mg/dL. Values below 70 mg/dL are marked low/critical, and values above 180 mg/dL are marked high."
  },
  {
    q: "Is my medical data secure?",
    a: "Yes. All data is isolated by tenant (hospital scoping) and stored with strict authentication middleware. We isolate user records at the DB level, and only your assigned care team can view your clinical profiles."
  },
  {
    q: "Is there a cost to use the platform?",
    a: "DiabetesCare is free for patients whose clinics or hospitals are onboarded as partners of the platform."
  }
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg selection:bg-primary/20 selection:text-primary">
      <Navbar />
      <div className="relative overflow-hidden bg-gradient-to-b from-primary-light/40 via-surface to-bg">
        {/* Glow Effects */}
        <div className="absolute top-20 right-0 -z-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute top-80 left-0 -z-10 h-80 w-80 rounded-full bg-primary-light blur-3xl"></div>
        <Hero />
      </div>
      <TrustBar />
      <Features />
      <HowItWorks />
      <ClinicalScope />
      <Testimonials />
      <FAQ />
      <ForHospitals />
      <Footer />
    </div>
  );
}

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white shadow-sm">
            <Activity size={18} />
          </div>
          <span className="font-display text-base font-bold text-ink">DiabetesCare</span>
        </div>

        <nav className="hidden items-center gap-8 font-body text-sm font-semibold text-muted md:flex">
          <a href="#features" className="hover:text-primary transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-primary transition-colors">How it works</a>
          <a href="#clinical" className="hover:text-primary transition-colors">Clinical Scope</a>
          <a href="#hospitals" className="hover:text-primary transition-colors">For hospitals</a>
        </nav>

        {user ? (
          <Link
            to={HOME_PATH_BY_ROLE[user.role] || "/login"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-body text-sm font-semibold text-ink hover:text-primary transition-colors">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition-colors hover:bg-primary-dark shadow-sm"
            >
              Create account
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 lg:py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-primary-light border border-primary/10 px-3 py-1 font-body text-xs font-bold text-primary">
            <Sparkles size={12} /> Type 1 Diabetes Management
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-ink lg:text-5xl">
            Every reading,
            <br />
            in one steady view.
          </h1>
          <p className="max-w-md font-body text-base leading-relaxed text-muted">
            DiabetesCare helps Type 1 patients log glucose, insulin, meals, and activity in seconds —
            and gives care teams the full, clinical-grade picture between clinic visits.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-bold text-white hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg"
            >
              Create your account <ArrowRight size={16} />
            </Link>
            <a
              href="#hospitals"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-display text-sm font-bold text-ink hover:bg-bg transition-colors shadow-sm"
            >
              For hospitals & clinics
            </a>
          </div>
          
          <div className="flex gap-6 border-t border-border/80 pt-6 text-xs text-muted">
            <div>
              <span className="font-display text-lg font-bold text-ink block">100% Isolated</span>
              Multi-tenant privacy
            </div>
            <div className="border-l border-border/80 pl-6">
              <span className="font-display text-lg font-bold text-ink block">70-180 mg/dL</span>
              ADA Standard targets
            </div>
          </div>
        </div>

        {/* Interactive App Simulator Mockup */}
        <div className="relative">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary to-primary-light opacity-30 blur-lg"></div>
          <InteractiveAppSimulator />
        </div>
      </div>
    </section>
  );
}

function InteractiveAppSimulator() {
  const [logs, setLogs] = useState([
    { val: 124, context: "Bedtime (Yesterday)", time: "10:30 PM", type: "IN_RANGE" },
    { val: 92, context: "Fast (Morning)", time: "07:15 AM", type: "IN_RANGE" },
    { val: 145, context: "Post-Breakfast", time: "09:30 AM", type: "IN_RANGE" },
  ]);
  const [inputVal, setInputVal] = useState(115);
  const [context, setContext] = useState("Pre-Lunch");
  const [justLogged, setJustLogged] = useState(false);

  function handleAddLog(e) {
    e.preventDefault();
    if (!inputVal || inputVal <= 0) return;

    let type = "IN_RANGE";
    if (inputVal < 70) type = "LOW";
    if (inputVal > 180) type = "HIGH";

    const newLog = {
      val: parseInt(inputVal),
      context: context,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      type
    };

    setLogs((prev) => [...prev, newLog]);
    setJustLogged(true);
    setTimeout(() => setJustLogged(false), 2000);
  }

  // Calculate TIR (Time in Range) from current logs
  const inRangeCount = logs.filter(l => l.val >= 70 && l.val <= 180).length;
  const tir = logs.length > 0 ? Math.round((inRangeCount / logs.length) * 100) : 0;
  const averageGlucose = logs.length > 0 ? Math.round(logs.reduce((acc, l) => acc + l.val, 0) / logs.length) : 0;

  return (
    <div className="relative rounded-2xl bg-ink p-6 shadow-2xl text-white font-body overflow-hidden">
      {/* Sparkles effect */}
      {justLogged && (
        <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-full bg-success px-3 py-1 text-xs font-bold animate-bounce z-20">
          <Sparkles size={12} /> Log Saved Successfully!
        </div>
      )}

      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div>
          <p className="text-[10px] uppercase font-bold tracking-widest text-primary-light">Interactive Demo</p>
          <h3 className="font-display text-base font-bold">Try Logging Your Glucose</h3>
        </div>
        <div className="flex h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse"></div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Time in Range</p>
          <p className="numeral text-2xl font-extrabold text-green-400 mt-0.5">{tir}%</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-xl p-3">
          <p className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Average Glucose</p>
          <p className="numeral text-2xl font-extrabold text-white mt-0.5">{averageGlucose} <span className="text-xs font-normal">mg/dL</span></p>
        </div>
      </div>

      {/* SVG Trendline Chart */}
      <div className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 h-36 relative flex items-end justify-between">
        {/* Shaded target zone */}
        <div className="absolute left-0 right-0 top-[28%] bottom-[28%] bg-green-500/10 border-y border-dashed border-green-500/20 pointer-events-none"></div>
        <span className="absolute left-2.5 top-1.5 text-[8px] text-white/40">180 mg/dL</span>
        <span className="absolute left-2.5 bottom-1.5 text-[8px] text-white/40">70 mg/dL</span>
        <span className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-[8px] text-green-500/50 uppercase font-bold tracking-wider">Target Range</span>

        {/* Dynamic Plot */}
        <svg className="absolute inset-0 h-full w-full p-4 overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          {logs.length > 1 && (
            <path
              d={logs.map((l, index) => {
                const x = (index / (logs.length - 1)) * 100;
                // mapping value: 40mg/dL -> 95, 240mg/dL -> 5
                const y = 95 - ((l.val - 40) / 200) * 90;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ')}
              fill="none"
              stroke="#2B6CB0"
              strokeWidth="2.5"
            />
          )}
          {logs.map((l, index) => {
            const x = (index / (logs.length - 1)) * 100;
            const y = 95 - ((l.val - 40) / 200) * 90;
            let dotColor = "#2F9E6E"; // in range
            if (l.val < 70) dotColor = "#C4432E"; // low
            if (l.val > 180) dotColor = "#C2831F"; // high
            return (
              <circle key={index} cx={x} cy={y} r="2.5" fill={dotColor} stroke="white" strokeWidth="0.5" />
            );
          })}
        </svg>
      </div>

      {/* Simulator Inputs */}
      <form onSubmit={handleAddLog} className="mt-4 bg-white/5 border border-white/10 rounded-xl p-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-[9px] text-white/50 font-bold uppercase tracking-wider mb-1">Glucose Level (mg/dL)</label>
            <div className="relative">
              <input
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                min="40"
                max="400"
                className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-light"
                required
              />
              <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2 flex gap-1">
                {inputVal >= 70 && inputVal <= 180 && <span className="h-2 w-2 rounded-full bg-green-500" />}
                {inputVal < 70 && <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />}
                {inputVal > 180 && <span className="h-2 w-2 rounded-full bg-yellow-500" />}
              </div>
            </div>
          </div>
          <div className="w-1/2">
            <label className="block text-[9px] text-white/50 font-bold uppercase tracking-wider mb-1">Context</label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full bg-white/10 border border-white/10 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-primary-light [&>option]:text-ink"
            >
              <option value="Pre-Lunch">Pre-Lunch</option>
              <option value="Post-Lunch">Post-Lunch</option>
              <option value="Pre-Dinner">Pre-Dinner</option>
              <option value="Fast (Morning)">Fast (Morning)</option>
              <option value="Bedtime">Bedtime</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full flex items-center justify-center gap-1.5 bg-primary hover:bg-primary-dark transition-colors py-2 rounded-lg text-xs font-bold text-white shadow"
        >
          <Plus size={14} /> Add Reading to Simulator
        </button>
      </form>
    </div>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border bg-surface py-8">
      <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <p className="font-body text-sm text-muted text-center md:text-left max-w-md">
          Built in collaboration with <span className="font-semibold text-ink">PGI Chandigarh</span> — developed with clinical input from endocrinology experts.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 opacity-60">
          <span className="font-display font-extrabold text-sm tracking-wide text-ink border border-border px-3 py-1.5 rounded bg-bg">PGI CHANDIGARH</span>
          <span className="font-display font-semibold text-xs tracking-wider text-ink border border-border px-3 py-1.5 rounded bg-bg">ADA COMPLIANT</span>
          <span className="font-display font-bold text-xs tracking-wider text-ink border border-border px-3 py-1.5 rounded bg-bg">ISPAD STANDARDS</span>
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-lg">
        <p className="mb-2 font-body text-xs font-bold uppercase tracking-wide text-primary">Features</p>
        <h2 className="font-display text-3xl font-extrabold text-ink">Everything logged, nothing guessed</h2>
        <p className="mt-2 text-sm text-muted font-body">Structured metrics tailored for daily life and clinic consultation.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="group rounded-card border border-border bg-surface p-6 shadow-card hover:border-primary-light hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-light text-primary group-hover:bg-primary group-hover:text-white transition-colors duration-300">
              <Icon size={20} />
            </div>
            <h3 className="mb-2 font-display text-base font-bold text-ink">{title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted group-hover:text-ink/80 transition-colors">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-20 border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-lg">
          <p className="mb-2 font-body text-xs font-bold uppercase tracking-wide text-primary">How it works</p>
          <h2 className="font-display text-3xl font-extrabold text-ink">Three steps, every day</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 relative">
          {STEPS.map(({ step, title, body }) => (
            <div key={step} className="relative bg-bg rounded-2xl p-6 border border-border/50">
              <p className="numeral mb-3 text-sm font-bold text-primary bg-primary-light w-8 h-8 rounded-full flex items-center justify-center">{step}</p>
              <h3 className="mb-2 font-display text-base font-bold text-ink">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ClinicalScope() {
  return (
    <section id="clinical" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <span className="font-body text-xs font-bold uppercase tracking-wide text-primary mb-2 inline-block">Clinical Scope</span>
          <h2 className="font-display text-3xl font-extrabold text-ink">Actionable data, structured by clinical metrics</h2>
          <p className="mt-4 font-body text-sm text-muted leading-relaxed">
            DiabetesCare is built to structure patient self-monitoring data into standardized clinical indicators. Instead of sorting through disorganized paper notebooks, clinicians can view clear indicators that match international guidelines.
          </p>

          <div className="mt-6 space-y-4">
            <div className="flex gap-3">
              <div className="flex h-5 w-5 mt-0.5 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={14} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Standard Target Bounds</h4>
                <p className="text-xs text-muted mt-0.5">Fixed targets (70-180 mg/dL) keep data consistent across the entire patient registry.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex h-5 w-5 mt-0.5 items-center justify-center rounded-full bg-green-100 text-green-700">
                <CheckCircle2 size={14} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-ink">Multi-Tenant Scoping</h4>
                <p className="text-xs text-muted mt-0.5">Patients are strictly bound to their registering hospital, ensuring security and proper doctor delegation.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-surface border border-border p-6 rounded-2xl shadow-card space-y-4">
          <h3 className="font-display text-sm font-bold text-ink border-b border-border pb-3">Clinical Metrics Guidelines</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold">Very High Bounds</span>
              <span className="numeral font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">&gt; 250 mg/dL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold">High Bounds</span>
              <span className="numeral font-semibold text-warning bg-warning-light border border-warning/20 px-2 py-0.5 rounded">&gt; 180 mg/dL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold">Target Zone</span>
              <span className="numeral font-bold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">70 - 180 mg/dL</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold">Low Bounds (Hypo)</span>
              <span className="numeral font-semibold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">&lt; 70 mg/dL</span>
            </div>
          </div>
          <div className="bg-bg p-3 rounded-lg text-xs text-muted border border-border/80">
            <p className="font-semibold text-ink">Goal Target:</p>
            <p className="mt-0.5">&gt; 70% of readings within the target range (70-180 mg/dL) for optimal glycemic control.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [active, setActive] = useState(0);
  const items = [
    {
      text: "Before DiabetesCare, reviewing glucose logs was a slow process of flipping through pages. Now, having a clean, standardized dashboard with computed average glucose and Time-in-Range saves me minutes per checkup.",
      author: "Dr. Ananya Goel",
      role: "Endocrinologist, PGI Chandigarh",
      stars: 5
    },
    {
      text: "The self-logging is so quick I actually stick to it. Seeing my streak increase motivates me, and knowing my doctor sees the same trend line keeps me accountable.",
      author: "Rahul V.",
      role: "Type 1 Patient (Since 2021)",
      stars: 5
    }
  ];

  return (
    <section className="bg-surface py-20 border-y border-border">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary-light px-3 py-1 rounded-full">Testimonials</span>
        <h2 className="font-display text-3xl font-extrabold text-ink mt-4">Trusted by patients & clinicians</h2>
        
        <div className="mt-12 relative bg-bg border border-border rounded-2xl p-8 md:p-12 shadow-sm min-h-[220px] flex flex-col justify-between">
          <Quote className="absolute top-6 left-6 text-primary-light h-16 w-16 -z-0 opacity-40" />
          <div className="relative z-10">
            <p className="font-body text-base md:text-lg text-ink leading-relaxed italic">
              "{items[active].text}"
            </p>
          </div>
          <div className="mt-8 flex flex-col items-center z-10">
            <div className="flex gap-0.5 mb-2">
              {[...Array(items[active].stars)].map((_, i) => (
                <Star key={i} size={14} className="fill-warning text-warning" />
              ))}
            </div>
            <p className="font-display text-sm font-bold text-ink">{items[active].author}</p>
            <p className="text-xs text-muted">{items[active].role}</p>
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {items.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActive(idx)}
              className={`h-2.5 rounded-full transition-all duration-300 ${active === idx ? 'w-8 bg-primary' : 'w-2.5 bg-border hover:bg-muted'}`}
              aria-label={`Go to testimonial ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FAQ() {
  const [openIdx, setOpenIdx] = useState(null);

  return (
    <section className="mx-auto max-w-3xl px-6 py-20">
      <div className="text-center mb-12">
        <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary-light px-3 py-1 rounded-full">Support</span>
        <h2 className="font-display text-3xl font-extrabold text-ink mt-4">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div key={idx} className="border border-border bg-surface rounded-xl overflow-hidden transition-all duration-200">
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-display font-bold text-sm text-ink hover:bg-bg/40 transition-colors focus:outline-none"
              >
                <span>{faq.q}</span>
                <ChevronDown size={16} className={`text-muted transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-primary' : ''}`} />
              </button>
              <div className={`transition-all duration-200 ease-in-out ${isOpen ? 'max-h-40 border-t border-border/50' : 'max-h-0 pointer-events-none'}`}>
                <p className="p-5 font-body text-xs text-muted leading-relaxed bg-bg/20">
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ForHospitals() {
  return (
    <section id="hospitals" className="mx-auto max-w-6xl px-6 pb-20">
      <div className="relative overflow-hidden grid items-center gap-10 rounded-card bg-ink px-8 py-12 text-white lg:grid-cols-[1fr_auto] lg:px-14 shadow-xl">
        <div className="absolute top-0 right-0 h-40 w-40 bg-white/5 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Building2 size={20} />
          </div>
          <h2 className="mb-3 max-w-md font-display text-2xl font-bold leading-tight lg:text-3xl">
            One platform, scoped to your hospital
          </h2>
          <p className="max-w-md font-body text-xs leading-relaxed text-white/70">
            Every patient, doctor, and log entry is isolated to your hospital's own data — role-based access for doctors and administrators, built to onboard multiple clinic teams securely.
          </p>
        </div>
        <a
          href="mailto:partnerships@diabetescare.example"
          className="relative z-10 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 py-3 font-display text-sm font-bold text-ink hover:bg-white/90 transition-colors shadow"
        >
          Talk to us <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Activity size={16} />
          </div>
          <span className="font-display text-base font-bold text-ink">DiabetesCare</span>
        </div>

        <p className="mt-4 max-w-2xl font-body text-[11px] leading-relaxed text-muted">
          DiabetesCare is a data logging and monitoring tool built to support communication
          between patients and their care team. It does not provide medical advice, diagnosis,
          or treatment recommendations. Always consult your doctor before changing any
          medication, dose, or treatment plan.
        </p>

        <div className="mt-8 border-t border-border pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] text-muted">
          <p>© {new Date().getFullYear()} DiabetesCare. Built with PGI Chandigarh.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Terms of Service</a>
            <a href="#" className="hover:underline">Contact Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
}