import { Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { NAV_CONFIG } from "../../config/navConfig.js";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";

export function AppShell() {
  const { user } = useAuth();
  const location = useLocation();
  const navItems = NAV_CONFIG[user?.role] || [];

  // Dynamically compute the title from the current path matching the navItems config
  const activeItem = navItems.find((item) => item.path === location.pathname);
  const title = activeItem ? activeItem.label : "Dashboard";

  return (
    <div className="flex h-screen bg-bg">
      <Sidebar navItems={navItems} />
      <div className="flex flex-1 flex-col overflow-y-auto">
        <Topbar title={title} />
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
