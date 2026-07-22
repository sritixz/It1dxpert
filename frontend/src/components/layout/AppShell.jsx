// AppShell — the layout every authenticated page renders inside.
// Picks the right nav list for the logged-in user's role via NAV_CONFIG,
// so patient/doctor/admin dashboards each get their own sidebar without
// three separate layout components to maintain.

import { Outlet } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { NAV_CONFIG } from "../../config/navConfig.js";
import { Sidebar } from "./Sidebar.jsx";
import { Topbar } from "./Topbar.jsx";

export function AppShell({ title }) {
  const { user } = useAuth();
  const navItems = NAV_CONFIG[user?.role] || [];

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
