import { useState } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { NAV_CONFIG } from "../../config/navConfig.js";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";
import { Sparkles } from "lucide-react";

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = NAV_CONFIG[user?.role] || [];
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Dynamically compute the title from the current path matching the navItems config
  const activeItem = navItems.find((item) => item.path === location.pathname);
  const title = activeItem ? activeItem.label : "Dashboard";

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} isMobileNavOpen={isMobileNavOpen} onCloseMobileNav={() => setIsMobileNavOpen(false)} />
      <div className="flex flex-1 flex-col overflow-y-auto min-w-0">
        <Topbar title={title} onOpenMobileNav={() => setIsMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {user?.role === "PATIENT" && location.pathname !== "/patient/ai-assistant" && (
        <Link
          to="/patient/ai-assistant"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 font-body text-xs font-bold border border-indigo-400/20 group"
        >
          <Sparkles size={14} className="animate-pulse text-yellow-300 group-hover:rotate-12 transition-transform" />
          <span>Ask CareAI</span>
        </Link>
      )}
    </div>
  );
}
