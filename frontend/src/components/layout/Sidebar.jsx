import { NavLink } from "react-router-dom";
import {
  Home, ClipboardList, LineChart, Pill, Award, Settings,
  Users, Bell, User, Building2, ShieldCheck, Activity,
} from "lucide-react";

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
};

export function Sidebar({ navItems }) {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-surface">
      <div className="flex items-center gap-2 px-6 py-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white">
          <Activity size={18} />
        </div>
        <div>
          <p className="font-display text-base font-bold leading-tight text-ink">DiabetesCare</p>
          <p className="text-[11px] font-medium leading-tight text-muted">Type 1 Diabetes Management</p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3">
        {navItems.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path.split("/").length === 2}
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
    </aside>
  );
}
