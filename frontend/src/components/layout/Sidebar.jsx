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
    <div className="flex h-full flex-col bg-[#00383C] text-white select-none">
      {/* Top Brand Header */}
      <div className="flex items-center justify-between gap-3 px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#005E5D] text-white shadow-sm border border-white/10">
            <Activity size={18} />
          </div>
          <div>
            <p className="font-display text-base font-bold leading-tight text-white tracking-wide">T1D Care</p>
            <p className="text-[11px] font-medium leading-tight text-[#A2C0C2]">Doctor Dashboard</p>
          </div>
        </div>
        {/* Close button — mobile drawer only */}
        <button
          onClick={onCloseMobileNav}
          className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#A2C0C2] hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Hospital Partner Logo Card */}
      {showLogo && hospital?.logoUrl && (
        <div className="mx-4 mt-4 mb-2 flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm">
          <img
            src={`${BASE_URL}${hospital.logoUrl}`}
            alt="Hospital Logo"
            className="h-9 w-9 rounded-lg object-contain bg-white p-1"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-white">{hospital.name}</p>
            <p className="text-[10px] text-[#A2C0C2] font-medium">Partner Hospital</p>
          </div>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="mt-4 flex-1 space-y-1.5 px-3 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split("/").length === 2}
              onClick={onCloseMobileNav}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3.5 py-2.5 font-body text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-[#006766] text-white font-semibold shadow-md translate-x-0.5"
                    : "text-[#A2C0C2] hover:bg-[#004B50]/60 hover:text-white"
                }`
              }
            >
              <Icon size={18} strokeWidth={2} />
              <span className="truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Profile Section */}
      {user && (
        <div className="p-3 border-t border-white/10 bg-[#002B2E]">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="h-9 w-9 rounded-full bg-[#006766] flex items-center justify-center text-white font-bold text-sm border border-white/20 shrink-0">
              {user.email ? user.email.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-white">
                {user.patientProfile?.fullName || user.doctorProfile?.fullName || user.email?.split("@")[0] || "User"}
              </p>
              <p className="truncate text-[10px] text-[#A2C0C2]">
                {user.role === "DOCTOR"
                  ? user.doctorProfile?.specialization || "Endocrinologist"
                  : user.role === "PATIENT"
                  ? "Type 1 Patient"
                  : user.role}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop sidebar — Dark Teal background */}
      <aside className="hidden lg:flex h-screen w-64 flex-col border-r border-[#002B2E] bg-[#00383C] shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer — slides in over content */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobileNav}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-xs"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25 }}
              className="lg:hidden fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-[#00383C] shadow-float"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
