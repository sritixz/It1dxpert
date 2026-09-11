// Public landing page — lives at "/". Logged-out visitors see "Log in" /
// "Create account"; logged-in visitors see a "Go to Dashboard" CTA instead
// (see Navbar below), so there's no forced redirect away from a page
// someone might land on directly (e.g. from a shared link).

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity, ClipboardList, LineChart, Pill, Award, Users,
  ShieldCheck, Building2, ArrowRight, Flame, Menu, X, CheckCircle2,
  Stethoscope, Calendar, Clock, Play, Mail, Phone, MapPin, ChevronRight,
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
  {
    step: "01",
    title: "Log",
    body: "Record glucose, insulin, meals, and activity throughout the day.",
    icon: ClipboardList,
  },
  {
    step: "02",
    title: "Track",
    body: "See trends, streaks, and adherence build up automatically over time.",
    icon: LineChart,
  },
  {
    step: "03",
    title: "Share",
    body: "Your care team sees the same data, in real time, between visits.",
    icon: Users,
  },
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
      <StatsSection />
      <TrustBar />
      <ServicesSection />
      <WhyChooseUsSection />
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
    { href: "#features", label: "Services" },
    { href: "#how-it-works", label: "Why Choose Us" },
    { href: "#hospitals", label: "For Hospitals" },
  ];

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-[#00383C]/95 text-white shadow-md backdrop-blur-md"
          : "bg-[#00383C] text-white border-b border-white/10"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#006766] text-white shadow-sm border border-white/20">
            <Activity size={18} />
          </div>
          <span className="font-display text-lg font-bold tracking-tight text-white">DiabetesCare</span>
        </div>

        <nav className="hidden items-center gap-8 font-body text-sm font-medium text-[#A2C0C2] md:flex">
          <a href="#" className="py-1 text-white hover:text-white font-semibold transition-colors">Home</a>
          {links.map((link) => (
            <a key={link.href} href={link.href} className="py-1 hover:text-white transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        {user ? (
          <Link
            to={HOME_PATH_BY_ROLE[user.role] || "/login"}
            className="hidden items-center gap-1.5 rounded-xl bg-[#006766] px-4 py-2.5 font-display text-sm font-semibold text-white transition-all hover:bg-[#005252] shadow-sm hover:shadow md:inline-flex"
          >
            Go to Dashboard <ArrowRight size={14} />
          </Link>
        ) : (
          <div className="hidden items-center gap-3 md:flex">
            <Link to="/login" className="font-body text-sm font-medium text-[#A2C0C2] hover:text-white transition-colors px-2 py-1">
              Log in
            </Link>
            <Link
              to="/register"
              className="rounded-xl bg-[#006766] px-4 py-2.5 font-display text-sm font-semibold text-white transition-all hover:bg-[#005252] shadow-sm hover:shadow"
            >
              Create account
            </Link>
          </div>
        )}

        <button className="md:hidden text-white" onClick={() => setMobileOpen((v) => !v)} aria-label="Toggle menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {mobileOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-white/10 bg-[#002B2E] px-6 py-4 md:hidden"
        >
          <div className="flex flex-col gap-3 font-body text-sm">
            <a href="#" onClick={() => setMobileOpen(false)} className="text-white font-semibold">Home</a>
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="text-[#A2C0C2] hover:text-white">
                {link.label}
              </a>
            ))}
            <div className="mt-2 flex gap-3">
              <Link to="/login" className="flex-1 rounded-lg border border-white/20 py-2 text-center font-medium text-white">
                Log in
              </Link>
              <Link to="/register" className="flex-1 rounded-lg bg-[#006766] py-2 text-center font-semibold text-white">
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
  const [selectedRole, setSelectedRole] = useState("Patient");

  return (
    <section className="relative bg-[#00383C] text-white pt-10 pb-28 lg:pt-14 lg:pb-36 overflow-hidden">
      <BackgroundBlobs />

      <div className="relative mx-auto max-w-6xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-12">
          {/* Left Hero Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 font-body text-xs font-semibold text-[#A2C0C2] backdrop-blur-xs border border-white/10"
            >
              <span className="h-2 w-2 rounded-full bg-[#00A896] animate-pulse" />
              Type 1 Diabetes Management
            </motion.p>

            <h1 className="font-display text-4xl font-extrabold leading-[1.15] text-white lg:text-5xl tracking-tight">
              Every reading,
              <br />
              in one{" "}
              <span className="relative inline-block text-[#A2C0C2]">
                steady view
                <svg
                  className="absolute -bottom-1 left-0 w-full"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <motion.path
                    d="M2 8 C 50 2, 150 2, 198 8"
                    stroke="#006766"
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

            <p className="mt-5 max-w-lg font-body text-base leading-relaxed text-[#A2C0C2]">
              DiabetesCare helps Type 1 patients log glucose, insulin, meals, and activity daily —
              and gives care teams the full picture between visits, not just at appointments.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                to="/register"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#006766] px-6 py-3.5 font-display text-sm font-bold text-white transition-all hover:bg-[#005252] hover:shadow-lg shadow-md"
              >
                Create your account
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#hospitals"
                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-display text-sm font-semibold text-white transition-all hover:bg-white/10 backdrop-blur-xs"
              >
                For hospitals & clinics
              </a>
            </div>
          </motion.div>

          {/* Right Floating Quick Access Card (Overlaps section bottom) */}
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 relative z-20"
          >
            <div className="rounded-2xl border border-white/20 bg-white p-6 shadow-2xl text-ink translate-y-6 lg:translate-y-12">
              <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-light text-primary">
                    <Stethoscope size={16} />
                  </div>
                  <p className="font-display text-sm font-bold text-ink">Access Care Portal</p>
                </div>
                <span className="rounded-full bg-success-light px-2.5 py-0.5 font-body text-[11px] font-bold text-success border border-success/30">
                  Live Sync
                </span>
              </div>

              {/* Role Quick Selector */}
              <div className="mb-4">
                <label className="mb-1.5 block font-body text-xs font-semibold text-muted">Select Portal Role</label>
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-surfaceInset p-1 border border-border">
                  {["Patient", "Doctor", "Admin"].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSelectedRole(role)}
                      className={`rounded-lg py-1.5 font-body text-xs font-semibold transition-all ${
                        selectedRole === role
                          ? "bg-[#00383C] text-white shadow-xs"
                          : "text-muted hover:text-ink"
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Demo / Quick Jump */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block font-body text-xs font-medium text-muted">Account Email or Hospital ID</label>
                  <input
                    type="text"
                    placeholder={`Enter your ${selectedRole.toLowerCase()} email...`}
                    className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 font-body text-xs text-ink placeholder:text-muted focus:border-primary focus:outline-none"
                    readOnly
                  />
                </div>

                <Link
                  to={selectedRole === "Patient" ? "/register" : "/login"}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#00383C] px-4 py-3 font-display text-xs font-bold text-white transition-all hover:bg-[#002B2E] shadow-sm"
                >
                  Proceed to {selectedRole} Portal <ArrowRight size={14} />
                </Link>
              </div>

              {/* Live Glucose Wave Card preview inside */}
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-body text-[11px] font-bold uppercase tracking-wide text-muted">Current Target Range</p>
                  <p className="numeral text-xs font-bold text-primary">70–180 mg/dL</p>
                </div>
                <GlucoseWave className="w-full h-12" strokeColor="#006766" fillColor="#006766" fillOpacity="0.1" gridColor="#E2E8F0" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatsSection() {
  return (
    <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-10">
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
    <section className="border-y border-border bg-surface py-8">
      <Reveal>
        <div className="mx-auto max-w-6xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="font-body text-sm text-muted text-center md:text-left max-w-md">
            Built in collaboration with <span className="font-bold text-ink">PGI Chandigarh</span> —
            developed with clinical input from an endocrinology team, not by patients alone.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 grayscale hover:grayscale-0 transition-all">
            <span className="font-display text-sm font-extrabold tracking-wider text-ink/70">PGI CHANDIGARH</span>
            <span className="font-display text-sm font-bold tracking-wider text-ink/70">DEXCOM</span>
            <span className="font-display text-sm font-bold tracking-wider text-ink/70">ABBOTT</span>
            <span className="font-display text-sm font-bold tracking-wider text-ink/70">ROCHE</span>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20">
      {/* Top Section Header with Right-aligned Action */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
        <Reveal className="max-w-lg">
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">Our Special Services</p>
          <h2 className="font-display text-3xl font-bold text-ink">Everything logged, nothing guessed</h2>
        </Reveal>
        <Reveal>
          <a
            href="#hospitals"
            className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-light px-4 py-2 font-display text-xs font-bold text-primary hover:bg-primary hover:text-white transition-all"
          >
            See All Services <ArrowRight size={14} />
          </a>
        </Reveal>
      </div>

      {/* 3-Column Feature Cards Grid matching image layout */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, body }, i) => (
          <Reveal key={title} delay={i * 0.08}>
            <div className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary hover:shadow-md">
              <div>
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary-light text-primary group-hover:bg-[#00383C] group-hover:text-white transition-colors">
                  <Icon size={22} />
                </div>
                <h3 className="mb-2 font-display text-base font-bold text-ink group-hover:text-primary transition-colors">{title}</h3>
                <p className="font-body text-sm leading-relaxed text-muted">{body}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border/50">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1 font-display text-xs font-bold text-primary group-hover:translate-x-1 transition-transform"
                >
                  Learn More <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function WhyChooseUsSection() {
  return (
    <section id="how-it-works" className="bg-[#F4F7F6] py-20 border-y border-border">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
          {/* Left Doctor Illustration / Card Frame */}
          <div className="lg:col-span-5">
            <Reveal>
              <div className="relative rounded-2xl border border-border bg-surface p-6 shadow-md overflow-hidden">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00383C] text-white mb-6">
                  <Stethoscope size={32} />
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-2">Endocrinology Care Team</h3>
                <p className="font-body text-xs text-muted mb-4">
                  Developed with clinical guidance from PGI Chandigarh endocrinologists to optimize glucose time-in-range and adherence.
                </p>
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center gap-2 font-body text-xs text-ink font-medium">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>24/7 Out-of-range Threshold Alerts</span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-xs text-ink font-medium">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>70–180 mg/dL Target Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2 font-body text-xs text-ink font-medium">
                    <CheckCircle2 size={16} className="text-success" />
                    <span>Multi-Tenant Hospital Data Scoping</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Section: Why Choose Us / 3 Step Feature Rows */}
          <div className="lg:col-span-7">
            <Reveal className="mb-8">
              <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-primary">Why Choose Us</p>
              <h2 className="font-display text-3xl font-bold text-ink mb-3">Three steps, every day</h2>
              <p className="font-body text-sm text-muted">
                DiabetesCare streamlines daily logging and gives endocrinologists actionable real-time insights between clinic visits.
              </p>
            </Reveal>

            <div className="space-y-6">
              {STEPS.map(({ step, title, body, icon: StepIcon }, i) => (
                <Reveal key={step} delay={i * 0.12}>
                  <div className="flex items-start gap-4 rounded-xl border border-border bg-surface p-4.5 shadow-xs transition-all hover:border-primary">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary font-display font-bold">
                      <StepIcon size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-xs font-extrabold text-primary">STEP {step}</span>
                        <h3 className="font-display text-base font-bold text-ink">{title}</h3>
                      </div>
                      <p className="mt-1 font-body text-xs leading-relaxed text-muted">{body}</p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ForHospitals() {
  return (
    <section id="hospitals" className="mx-auto max-w-6xl px-6 py-20">
      <Reveal>
        <div className="relative overflow-hidden rounded-2xl bg-[#00383C] border border-white/10 px-8 py-12 text-white lg:px-14 shadow-xl">
          <div className="relative grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white border border-white/15">
                <Building2 size={20} />
              </div>
              <h2 className="mb-3 max-w-md font-display text-2xl font-bold leading-tight lg:text-3xl">
                One platform, scoped to your hospital
              </h2>
              <p className="max-w-md font-body text-sm leading-relaxed text-[#A2C0C2]">
                Every patient, doctor, and log entry is isolated to your hospital's own data —
                role-based access for doctors and administrators, built to onboard more than one
                care team without re-architecting anything.
              </p>
            </div>
            <a
              href="mailto:partnerships@diabetescare.example"
              className="group inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-white px-6 py-3.5 font-display text-sm font-bold text-[#00383C] transition-all hover:bg-white/90 hover:shadow-lg"
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
    <footer className="bg-[#002B2E] text-white border-t border-white/10 pt-14 pb-8">
      <div className="mx-auto max-w-6xl px-6">
        {/* 4-Column Layout matching healthcare reference image footer */}
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12 mb-12">
          {/* Column 1: Brand & Contact Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#006766] text-white">
                <Activity size={16} />
              </div>
              <span className="font-display text-base font-bold text-white">DiabetesCare</span>
            </div>
            <p className="font-body text-xs leading-relaxed text-[#A2C0C2]">
              Built in collaboration with PGI Chandigarh endocrinology team for Type 1 Diabetes monitoring and adherence.
            </p>
            <div className="space-y-2 pt-2 text-xs text-[#A2C0C2]">
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#00A896]" />
                <span>Sector 12, Chandigarh, 160012, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={14} className="text-[#00A896]" />
                <span>+91 (172) 275-6000</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={14} className="text-[#00A896]" />
                <span>support@t1dcare.org</span>
              </div>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-display text-sm font-bold text-white">About Us</h4>
            <ul className="space-y-2 font-body text-xs text-[#A2C0C2]">
              <li><a href="#features" className="hover:text-white transition-colors">Our Mission & Values</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">PGI Collaboration</a></li>
              <li><a href="#hospitals" className="hover:text-white transition-colors">Hospital Scoping</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Clinical Reports</a></li>
            </ul>
          </div>

          {/* Column 3: Services */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-sm font-bold text-white">Our Services</h4>
            <ul className="space-y-2 font-body text-xs text-[#A2C0C2]">
              <li><Link to="/register" className="hover:text-white transition-colors">Daily Glucose Logging</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Insulin Adherence Score</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Hypo Alert Warnings</Link></li>
              <li><Link to="/register" className="hover:text-white transition-colors">Care Team Dashboard</Link></li>
            </ul>
          </div>

          {/* Column 4: Support / Hospital Hours Table */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-display text-sm font-bold text-white">Hospital Time</h4>
            <div className="space-y-2 font-body text-xs text-[#A2C0C2] rounded-xl bg-white/5 p-3.5 border border-white/10">
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>Monday - Friday</span>
                <span className="font-mono text-white">08:00 - 20:00</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-1.5">
                <span>Saturday</span>
                <span className="font-mono text-white">09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sunday</span>
                <span className="font-mono text-white">10:00 - 16:00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Safety Disclaimer & Copyright Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="max-w-2xl font-body text-[11px] leading-relaxed text-[#A2C0C2]/80">
            DiabetesCare is a data logging and monitoring tool built to support communication
            between patients and their care team. It does not provide medical advice, diagnosis,
            or treatment recommendations. Always consult your doctor before changing any
            medication, dose, or treatment plan.
          </p>

          <p className="font-body text-xs text-[#A2C0C2] shrink-0">
            © {new Date().getFullYear()} DiabetesCare. Built with PGI Chandigarh.
          </p>
        </div>
      </div>
    </footer>
  );
}
