import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';
import { Swords, LayoutDashboard, Medal, Backpack, LogOut, Users, Shield } from 'lucide-react';
import { AuthGuard } from './AuthGuard';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/battle', label: 'Battle', icon: Swords },
  { to: '/rank', label: 'Rank', icon: Medal },
  { to: '/generals', label: 'Generals', icon: Users },
  { to: '/army', label: 'Army', icon: Shield },
  { to: '/inventory', label: 'Inventory', icon: Backpack },
];

export function Layout() {
  const playerId = useAuthStore((s) => s.playerId);
  const logout = useAuthStore((s) => s.logout);
  const { data } = usePlayer(playerId);

  return (
    <AuthGuard>
      <div className="flex h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r border-border bg-card flex flex-col">
          <div className="p-6 border-b border-border">
            <h1 className="text-lg font-bold text-primary">Rise of the General</h1>
            {data && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">{data.player.username}</p>
                <p>{data.rank?.title ?? 'Unknown Rank'}</p>
              </div>
            )}
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="p-4 border-t border-border">
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent w-full transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-8">
          <Outlet />
        </main>
      </div>
    </AuthGuard>
  );
}
