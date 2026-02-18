import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
import {
  Swords,
  LayoutDashboard,
  Medal,
  Backpack,
  LogOut,
  Users,
  Shield,
  Globe,
  Map,
  Crown,
  Scale,
  UserCheck,
  Menu,
  X,
} from 'lucide-react';
import { AuthGuard } from './AuthGuard';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/battle', label: 'Battle', icon: Swords },
  { to: '/world', label: 'World Map', icon: Globe },
  { to: '/campaigns', label: 'Campaigns', icon: Map },
  { to: '/dynasty', label: 'Dynasty', icon: Crown },
  { to: '/characters', label: 'Characters', icon: UserCheck },
  { to: '/politics', label: 'Politics', icon: Scale },
  { to: '/rank', label: 'Rank', icon: Medal },
  { to: '/generals', label: 'Generals', icon: Users },
  { to: '/army', label: 'Army', icon: Shield },
  { to: '/inventory', label: 'Inventory', icon: Backpack },
];

function SidebarContent({
  onNavClick,
  logout,
  data,
}: {
  onNavClick?: () => void;
  logout: () => void;
  data: any;
}) {
  return (
    <>
      <div className="p-5 border-b border-border">
        <h1 className="text-base font-bold text-primary leading-tight">Rise of the General</h1>
        {data && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{data.player.username}</p>
            <p>{data.rank?.title ?? 'Unknown Rank'}</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-border">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Logout
        </button>
      </div>
    </>
  );
}

export function Layout() {
  const playerId = useAuthStore((s) => s.playerId);
  const logout = useAuthStore((s) => s.logout);
  const { data } = usePlayer(playerId);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const currentLabel =
    navItems.find((n) => location.pathname.startsWith(n.to))?.label ?? 'Rise of the General';

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* ── Desktop sidebar (md+) ── */}
        <aside className="hidden md:flex w-56 shrink-0 border-r border-border bg-card flex-col">
          <SidebarContent logout={logout} data={data} />
        </aside>

        {/* ── Mobile drawer overlay ── */}
        {drawerOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
        )}
        <aside
          className={`fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 md:hidden ${
            drawerOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-sm font-bold text-primary">Rise of the General</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 rounded-md hover:bg-accent"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {data && (
            <div className="px-4 py-2 border-b border-border text-xs text-muted-foreground">
              <p className="font-medium text-foreground">{data.player.username}</p>
              <p>{data.rank?.title ?? 'Unknown Rank'}</p>
            </div>
          )}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setDrawerOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="p-3 border-t border-border">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Logout
            </button>
          </div>
        </aside>

        {/* ── Right side: mobile top bar + content ── */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          {/* Mobile top bar */}
          <header className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
            <button
              onClick={() => setDrawerOpen(true)}
              className="p-1.5 rounded-md hover:bg-accent"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-foreground truncate">{currentLabel}</span>
          </header>

          {/* Page content */}
          <main className="flex-1 overflow-auto p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
