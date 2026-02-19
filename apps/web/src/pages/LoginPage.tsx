import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { useLogin } from '@/hooks/usePlayer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ParticleBackground } from '@/components/canvas/ParticleBackground';
import { motion } from 'framer-motion';

export function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);
  const login = useLogin();

  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (token) navigate('/dashboard', { replace: true });
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const result = await login.mutateAsync({ username });
      setAuth(result.token, result.player._id);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <motion.div className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2 font-display tracking-wide">Rise of the General</h1>
          <p className="text-muted-foreground">The warring states await your command</p>
        </div>

        <Card className="border-border/60 bg-card/90 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="font-display">Enter the Realm</CardTitle>
            <CardDescription>Speak your name, General</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-sm font-medium mb-2 block">Warrior Name</label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your warrior name"
                  minLength={1}
                  required
                  className="bg-background/60"
                />
              </div>

              {error && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-sm text-destructive">{error}</motion.p>
              )}

              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending ? 'Entering…' : 'Enter the Realm'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                New warrior?{' '}
                <Link to="/create" className="text-primary hover:underline">
                  Create a character
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
