// Public landing page — lives at "/". Logged-out visitors see "Log in" /
// "Create account"; logged-in visitors see a "Go to Dashboard" CTA instead
// (see Navbar below), so there's no forced redirect away from a page
// someone might land on directly (e.g. from a shared link).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ClipboardList, LineChart, Pill, Award, Users,
  ShieldCheck, Building2, ArrowRight, Flame, Menu, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { HOME_PATH_BY_ROLE } from "../../config/navConfig.js";
import { GlucoseWave } from "../../assets/GlucoseWave.jsx";
import { BackgroundBlobs } from "./BackgroundBlobs.jsx";
import { Reveal } from "../../components/ui/Reveal.jsx";
import { AnimatedStat } from "./AnimatedStat.jsx";

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

const STATS = [
  { target: 4, label: "Core logging categories", suffix: "" },
  { value: "70–180", label: "mg/dL target range tracked" },
  { target: 4, label: "Role-based access levels" },
  { value: "24/7", label: "Care team visibility" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg">
      <Navbar />
      <Hero />
      <Stats />
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
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How it works" },
    { href: "#hospitals", label: "For hospitals" },
  ];

  return (
    <header
      className={`sticky top-0 z-20 border-b transition-all duration-300 ${
        scrolled ? "border-border bg-surface/85 shadow-sm backdrop-blur-md" : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Activity size={16} />
          </div>
          <span className="font-display text-base font-bold text-ink">DiabetesCare</span>
        </div>

        <nav className="hidden items-center gap-8 font-body text-sm font-medium text-muted md:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="group relative py-1 hover:text-ink">
              {link.label}
              <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        {user ? (
          <Link
            to={HOME_PATH_BY_ROLE[user.role] || "/login"}
            className="hidden items-center gap-1.5 rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark md:inline-flex"
          >
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="font-body text-sm font-medium text-ink hover:text-primary">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-primary px-4 py-2 font-display text-sm font-semibold text-white transition-transform hover:-translate-y-0.5 hover:bg-primary-dark"
            >
              Create account
            </Link>
          </div>
        )}

        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border bg-surface px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3 font-body text-sm">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-muted">
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <Link to="/login" className="flex-1 rounded-lg border border-border py-2 text-center font-medium">
                Log in
              </Link>
              <Link to="/register" className="flex-1 rounded-lg bg-primary py-2 text-center font-semibold text-white">
                Create account
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative">
      <BackgroundBlobs />

      <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-primary-light px-3 py-1 font-body text-xs font-semibold text-primary"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Type 1 Diabetes Management
            </motion.p>

            <h1 className="font-display text-4xl font-bold leading-[1.1] text-ink lg:text-5xl">
              Every reading,
              <br />
              in one{" "}
              <span className="relative inline-block">
                steady view
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M2 8 C 50 2, 150 2, 198 8"
                    stroke="#2B6CB0"
                    strokeWidth="4"
                    strokeLinecap="round"
                    fill="none"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ delay: 0.9, duration: 0.8, ease: "easeInOut" }}
                  />
                </svg>
              </span>
              .
            </h1>

            <p className="mt-5 max-w-md font-body text-base leading-relaxed text-muted">
              DiabetesCare helps Type 1 patients log glucose, insulin, meals, and activity daily —
              and gives care teams the full picture between visits, not just at appointments.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 font-display text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-primary-dark hover:shadow-lg"
              >
                Create your account
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#hospitals"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 font-display text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:bg-bg"
              >
                For hospitals & clinics
              </a>
            </div>
          </motion.div>

          {/* Hero visual: glucose trend card + a floating gamification card
              layered on top, for depth and to hint at a second feature
              (streaks) without a second full section. */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative"
      >
        <div className="rounded-2xl border border-slate-200 bg-surface p-8 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <p className="font-body text-xs font-bold uppercase tracking-wide text-slate-400">Glucose Trends</p>
              <p className="numeral mt-1 text-2xl font-bold text-ink">128 mg/dL</p>
            </div>
            <span className="rounded-full bg-green-50 px-2.5 py-1 font-body text-xs font-bold text-green-700 border border-green-200">
              78% In Range
            </span>
          </div>
          <GlucoseWave className="w-full" strokeColor="#2B6CB0" fillColor="#2B6CB0" fillOpacity="0.05" gridColor="#CBD5E1" />
          <p className="mt-4 font-body text-xs text-muted">
            Glucose Trends dashboard overview showing average value, healthy target range, and standard deviations tracked automatically from daily logs.
          </p>
        </div>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

function Stats() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16">
      <div className="grid grid-cols-2 gap-8 rounded-card border border-border bg-surface p-8 shadow-card sm:grid-cols-4">
        {STATS.map((stat) => (
          <AnimatedStat key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <section className="border-y border-border bg-surface py-6">
      <Reveal>
        <p className="mx-auto max-w-6xl px-6 text-center font-body text-sm text-muted">
          Built in collaboration with <span className="font-semibold text-ink">PGI Chandigarh</span> —
          developed with clinical input from an endocrinology team, not by patients alone.
        </p>
      </Reveal>
    </section>
  );
}

function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal className="mb-12 max-w-lg">
        <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">Features</p>
        <h2 className="font-display text-3xl font-bold text-ink">Everything logged, nothing guessed</h2>
      </Reveal>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="group h-full rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm transition-all duration-300 hover:border-primary">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary">
                <Icon size={20} />
              </div>
              <h3 className="mb-1.5 font-display text-base font-bold text-ink">{title}</h3>
              <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-surface py-20">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal className="mb-14 max-w-lg">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">How it works</p>
          <h2 className="font-display text-3xl font-bold text-ink">Three steps, every day</h2>
        </Reveal>

        <div className="relative grid grid-cols-1 gap-10 sm:grid-cols-3">
          {/* Connecting line between steps, desktop only */}
          <div className="absolute left-0 right-0 top-5 hidden h-px bg-border sm:block" aria-hidden="true">
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: "easeInOut" }}
              className="h-full origin-left bg-primary"
            />
          </div>

          {STEPS.map(({ step, title, body }, i) => (
            <Reveal key={step} delay={i * 0.15}>
              <div className="relative">
                <div className="relative z-10 mb-4 flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary bg-surface font-display text-sm font-bold text-primary">
                  {i + 1}
                </div>
                <h3 className="mb-1.5 font-display text-lg font-bold text-ink">{title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function ForHospitals() {
  return (
    <section id="hospitals" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-slate-900 border border-slate-800 px-8 py-12 text-white lg:px-14">
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
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
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-white px-5 py-3 font-display text-sm font-semibold text-ink transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Talk to us
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </Reveal>
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
