import { NavLink } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, ClipboardList, LineChart, Pill, Award, Settings,
  Users, Bell, User, Building2, ShieldCheck, Activity, Calendar, HelpCircle,
  Syringe, Footprints, Bot, Utensils, FolderOpen, TrendingUp, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const ICONS = {
  home: Home,
  clipboard: ClipboardList,
  chart: LineChart,
  pill: Pill,
  award: Award,
  settings: Settings,
  users: Users,
  bell: Bell,
  user: User,
  building: Building2,
  shield: ShieldCheck,
  calendar: Calendar,
  help: HelpCircle,
  syringe: Syringe,
  activity: Footprints,
  bot: Bot,
  utensils: Utensils,
  folder: FolderOpen,
  trending: TrendingUp,
};

export function Sidebar({ navItems, isMobileNavOpen, onCloseMobileNav }) {
  const { user } = useAuth();

  const isPatientWithDoctor = user?.role === "PATIENT" && user?.patientProfile?.assignedDoctorId;
  const isDoctorWithPatients = user?.role === "DOCTOR" && user?.doctorProfile?.patients?.length > 0;

  const showLogo = isPatientWithDoctor || isDoctorWithPatients;
  const hospital = isPatientWithDoctor ? user?.patientProfile?.hospital : isDoctorWithPatients ? user?.doctorProfile?.hospital : null;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
  const BASE_URL = API_BASE_URL.replace("/api", "");

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between gap-2 px-6 py-6 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
            <Activity size={18} />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight text-ink">DiabetesCare</p>
            <p className="text-[11px] font-medium leading-tight text-muted">Type 1 Diabetes Management</p>
          </div>
        </div>
        {/* Close button — mobile drawer only */}
        <button
          onClick={onCloseMobileNav}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-muted hover:bg-bg hover:text-ink"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {showLogo && hospital?.logoUrl && (
        <div className="mx-6 mt-4 mb-2 flex items-center gap-2.5 rounded-xl border border-border bg-bg/50 p-2.5">
          <img
            src={`${BASE_URL}${hospital.logoUrl}`}
            alt="Hospital Logo"
            className="h-10 w-10 rounded-lg object-contain bg-white p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-ink">{hospital.name}</p>
            <p className="text-[10px] text-muted font-medium">Partner Hospital</p>
          </div>
        </div>
      )}

      <nav className="mt-4 flex-1 space-y-0.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split("/").length === 2}
              onClick={onCloseMobileNav}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm font-medium transition-colors ${
                  isActive ? "bg-primary-light text-primary" : "text-muted hover:bg-bg hover:text-ink"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible from lg breakpoint up */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-border bg-surface shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — slides in over content, closes on backdrop tap or nav click */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileNav}
              className="lg:hidden fixed inset-0 z-40 bg-black/50"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-float"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
