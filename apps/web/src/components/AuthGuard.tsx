import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayer } from '@/hooks/usePlayer';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const playerId = useAuthStore((s) => s.playerId);
  const location = useLocation();

  const { data, isLoading } = usePlayer(token ? playerId : null);

  if (!token) {
    return <Navigate to="/create" replace />;
  }

  // While player data loads don't redirect yet
  if (isLoading) return null;

  const successionPending = (data?.player as any)?.successionPending ?? false;

  if (successionPending && location.pathname !== '/succession') {
    return <Navigate to="/succession" replace />;
  }

  return <>{children}</>;
}
