import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  RiDashboardLine,
  RiLogoutBoxRLine,
  RiMenuLine,
  RiNotification3Line,
  RiTicket2Line,
  RiUserSettingsLine,
} from "@remixicon/react";
import { DashboardSidebar } from "@/components/application/dashboard/dashboard-sidebar";
import { Avatar } from "@/components/base/avatar/avatar";
import { Button } from "@/components/base/buttons/button";
import { IconButton } from "@/components/base/buttons/icon-button";
import { Drawer } from "@/components/base/drawer/drawer";
import { useAuth } from "@/context/AuthContext";
import api from "@/api/api";
import { getInitials } from "@/utils/helpers";

const Layout = () => {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const getUnread = async () => {
    try {
      const res = await api.get("/notifications", { params: { limit: 1 } });
      setUnread(res.data.unreadCount);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getUnread();
    const interval = setInterval(getUnread, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const items: any[] = [
    { key: "dashboard", label: "Dashboard", icon: RiDashboardLine, href: "/" },
    { key: "tickets", label: isAdmin ? "All tickets" : "My tickets", icon: RiTicket2Line, href: "/tickets" },
    { key: "notifications", label: "Notifications", icon: RiNotification3Line, href: "/notifications" },
  ];

  if (unread > 0) {
    items[2].badge = unread;
  }
  if (isAdmin) {
    items.push({ key: "users", label: "Users", icon: RiUserSettingsLine, href: "/admin/users" });
  }

  let selected = "dashboard";
  if (location.pathname.startsWith("/tickets")) selected = "tickets";
  if (location.pathname.startsWith("/notifications")) selected = "notifications";
  if (location.pathname.startsWith("/admin")) selected = "users";

  const handleNavigate = (item: any) => {
    setMenuOpen(false);
    navigate(item.href);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const account = (collapsed: boolean) => (
    <div className="flex items-center gap-2">
      <Avatar size="md" color="blue" initials={getInitials(user.name)} />
      {!collapsed && (
        <div className="flex flex-col">
          <span className="text-body-medium text-text-primary">{user.name}</span>
          <span className="text-caption-1-medium text-text-tertiary">{isAdmin ? "Administrator" : "Customer"}</span>
        </div>
      )}
    </div>
  );

  const footer = (collapsed: boolean) => (
    <Button
      variant="ghost"
      size="small"
      leadingIcon={RiLogoutBoxRLine}
      iconOnly={collapsed}
      aria-label="Sign out"
      onClick={handleLogout}
    >
      {collapsed ? undefined : "Sign out"}
    </Button>
  );

  return (
    <div className="flex h-dvh gap-3 bg-background-full p-2 sm:p-3">
      <DashboardSidebar
        items={items}
        selected={selected}
        onNavigate={handleNavigate}
        account={account}
        footer={footer}
        className="hidden lg:flex"
      />

      <Drawer isOpen={menuOpen} onOpenChange={setMenuOpen} placement="start" size="sm" aria-label="Navigation">
        <DashboardSidebar
          items={items}
          selected={selected}
          onNavigate={handleNavigate}
          account={account}
          footer={footer}
          mobile
          flat
          onClose={() => setMenuOpen(false)}
          className="w-full"
        />
      </Drawer>

      <main className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border-button-default bg-background-primary-default">
        <div className="flex items-center gap-2 border-b border-separator-border px-4 py-3 lg:hidden">
          <IconButton icon={RiMenuLine} aria-label="Open navigation" onClick={() => setMenuOpen(true)} />
          <span className="text-headline-semibold text-text-primary">Helpdesk</span>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Outlet context={{ getUnread }} />
        </div>
      </main>
    </div>
  );
};

export default Layout;
