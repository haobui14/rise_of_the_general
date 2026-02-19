import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useRegister } from '@/hooks/usePlayer';
import { fetchApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import type { FactionListResponse, IFaction } from '@rotg/shared-types';
import { ParticleBackground } from '@/components/canvas/ParticleBackground';
import { FactionCrest } from '@/components/icons/FactionCrest';
import { motion } from 'framer-motion';

export function CreatePlayerPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const register = useRegister();

  const [username, setUsername] = useState('');
  const [selectedFaction, setSelectedFaction] = useState<string | null>(null);
  const [factions, setFactions] = useState<IFaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    fetchApi<FactionListResponse>('/factions')
      .then((data) => setFactions(data.factions))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedFaction) {
      setError('Please select a faction');
      return;
    }

    try {
      const result = await register.mutateAsync({
        username,
        factionId: selectedFaction,
      });
      setAuth(result.token, result.player._id);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  const factionColors: Record<string, string> = {
    Wei: 'border-blue-500/70 bg-blue-500/10 shadow-[0_0_12px_rgba(59,130,246,0.15)]',
    Shu: 'border-green-500/70 bg-green-500/10 shadow-[0_0_12px_rgba(34,197,94,0.15)]',
    Wu: 'border-red-500/70 bg-red-500/10 shadow-[0_0_12px_rgba(239,68,68,0.15)]',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <motion.div className="w-full max-w-2xl relative z-10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 font-display tracking-wide">Rise of the General</h1>
          <p className="text-muted-foreground">Begin your journey from peasant to warlord</p>
        </div>

        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display">Forge Your Destiny</CardTitle>
            <CardDescription>Choose your name and pledge allegiance to a faction</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Warrior Name</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your warrior name"
                  minLength={3}
                  maxLength={30}
                  required
                  className="bg-background/60"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-3 block">Pledge Allegiance</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {factions.map((faction) => (
                    <button
                      key={faction._id}
                      type="button"
                      onClick={() => setSelectedFaction(faction._id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all ${
                        selectedFaction === faction._id
                          ? factionColors[faction.name] || 'border-primary bg-primary/10'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <FactionCrest faction={faction.name} size={28} />
                        <p className="font-display font-bold text-base">{faction.name}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{faction.leaderName}</p>
                      <div className="text-xs space-y-0.5">
                        {Object.entries(faction.baseBonus).map(
                          ([stat, val]) =>
                            val > 0 && (
                              <p key={stat} className="text-green-400">+{val} {stat}</p>
                            ),
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-destructive">{error}</motion.p>
              )}

              <Button type="submit" className="w-full" disabled={register.isPending}>
                {register.isPending ? 'Forging your legend…' : 'Begin Your Journey'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Already a general?{' '}
                <Link to="/login" className="text-primary hover:underline">Login</Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
