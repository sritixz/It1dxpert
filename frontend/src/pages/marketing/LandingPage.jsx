// Public landing page — lives at "/". Logged-out visitors see "Log in" /
// "Create account"; logged-in visitors see a "Go to Dashboard" CTA instead
// (see Navbar below), so there's no forced redirect away from a page
// someone might land on directly (e.g. from a shared link).

import { Link } from "react-router-dom";
import {
  Activity, ClipboardList, LineChart, Pill, Award, Users,
  ShieldCheck, Building2, ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { HOME_PATH_BY_ROLE } from "../../config/navConfig.js";
import { GlucoseWave } from "../../assets/GlucoseWave.jsx";

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

export function LandingPage() {
  return (
    <div className="min-h-screen bg-bg">
      <Navbar />
      <Hero />
      <TrustBar />
      <Features />
      <HowItWorks />
      <ForHospitals />
      <Footer />
    </div>
  );
}

function Navbar() {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Activity size={16} />
          </div>
          <span className="font-display text-base font-bold text-ink">DiabetesCare</span>
        </div>

        <nav className="hidden items-center gap-8 font-body text-sm font-medium text-muted md:flex">
          <a href="#features" className="hover:text-ink">Features</a>
          <a href="#how-it-works" className="hover:text-ink">How it works</a>
          <a href="#hospitals" className="hover:text-ink">For hospitals</a>
        </nav>

        {user ? (
          <Link
            to={HOME_PATH_BY_ROLE[user.role] || "/login"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <Link to="/login" className="font-body text-sm font-medium text-ink hover:text-primary">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white hover:bg-primary-dark"
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
    <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <p className="mb-4 inline-block rounded-full bg-primary-light px-3 py-1 font-body text-xs font-semibold text-primary">
            Type 1 Diabetes Management
          </p>
          <h1 className="font-display text-4xl font-bold leading-[1.1] text-ink lg:text-5xl">
            Every reading,
            <br />
            in one steady view.
          </h1>
          <p className="mt-5 max-w-md font-body text-base leading-relaxed text-muted">
            DiabetesCare helps Type 1 patients log glucose, insulin, meals, and activity daily —
            and gives care teams the full picture between visits, not just at appointments.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-semibold text-white hover:bg-primary-dark"
            >
              Create your account <ArrowRight size={16} />
            </Link>
            <a
              href="#hospitals"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-display text-sm font-semibold text-ink hover:bg-bg"
            >
              For hospitals & clinics
            </a>
          </div>
        </div>

        <div className="rounded-card bg-ink p-8 shadow-card">
          <GlucoseWave className="w-full" />
          <p className="mt-4 font-body text-sm text-white/60">
            A simplified view of Glucose Trends — average, target range, and time-in-range,
            tracked automatically from daily logs.
          </p>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border bg-surface py-6">
      <p className="mx-auto max-w-6xl px-6 text-center font-body text-sm text-muted">
        Built in collaboration with <span className="font-semibold text-ink">PGI Chandigarh</span> —
        developed with clinical input from an endocrinology team, not by patients alone.
      </p>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <div className="mb-12 max-w-lg">
        <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">Features</p>
        <h2 className="font-display text-3xl font-bold text-ink">Everything logged, nothing guessed</h2>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-card border border-border bg-surface p-6 shadow-card">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
              <Icon size={20} />
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-ink">{title}</h3>
            <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-12 max-w-lg">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">How it works</p>
          <h2 className="font-display text-3xl font-bold text-ink">Three steps, every day</h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {STEPS.map(({ step, title, body }) => (
            <div key={step}>
              <p className="numeral mb-3 text-sm font-semibold text-primary">{step}</p>
              <h3 className="mb-1.5 font-display text-lg font-bold text-ink">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForHospitals() {
  return (
    <section id="hospitals" className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-10 rounded-card bg-ink px-8 py-12 text-white lg:grid-cols-[1fr_auto] lg:px-14">
        <div>
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
            <Building2 size={20} />
          </div>
          <h2 className="mb-3 max-w-md font-display text-2xl font-bold leading-tight lg:text-3xl">
            One platform, scoped to your hospital
          </h2>
          <p className="max-w-md font-body text-sm leading-relaxed text-white/70">
            Every patient, doctor, and log entry is isolated to your hospital's own data —
            role-based access for doctors and administrators, built to onboard more than one
            care team without re-architecting anything.
          </p>
        </div>
        <a
          href="mailto:partnerships@diabetescare.example"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 py-3 font-display text-sm font-semibold text-ink hover:bg-white/90"
        >
          Talk to us <ArrowRight size={16} />
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border bg-surface py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white">
            <Activity size={14} />
          </div>
          <span className="font-display text-sm font-bold text-ink">DiabetesCare</span>
        </div>

        {/* Compliance-safety disclaimer — deliberate, ties back to the
            decision to keep this a monitoring tool, not an advisory one. */}
        <p className="mt-4 max-w-2xl font-body text-xs leading-relaxed text-muted">
          DiabetesCare is a data logging and monitoring tool built to support communication
          between patients and their care team. It does not provide medical advice, diagnosis,
          or treatment recommendations. Always consult your doctor before changing any
          medication, dose, or treatment plan.
        </p>

        <p className="mt-6 font-body text-xs text-muted">
          © {new Date().getFullYear()} DiabetesCare. Built with PGI Chandigarh.
        </p>
      </div>
    </footer>
  );
}