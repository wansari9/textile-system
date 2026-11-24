import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { login, getMe } from '../../api/auth';
import { Button, Input } from '../../components/ui';
import { Factory } from 'lucide-react';
import { auth } from '../../design';
import { homeForRole } from '../../domain';
import { clearSession, getSessionUser, getToken, saveSession } from '../../lib/session';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in with a still-valid token? Go straight to the landing page.
  useEffect(() => {
    if (!getToken() || !getSessionUser()) return;

    let active = true;
    getMe()
      .then(() => {
        const user = getSessionUser();
        if (active && user) navigate(homeForRole(user.role), { replace: true });
      })
      .catch(() => {
        clearSession();
      });

    return () => {
      active = false;
    };
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      if (res.success && res.token && res.user) {
        saveSession(res.token, res.user);
        navigate(homeForRole(res.user.role), { replace: true });
      } else {
        setError('Unexpected response from the server. Please try again.');
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data as { message?: string } | undefined)?.message
        : undefined;
      setError(message || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={auth.shell}>
      {/* Brand panel */}
      <div className={auth.brandPanel}>
        <div className="absolute inset-0 opacity-[0.04]">
          <div className={auth.brandGlowTop} />
          <div className={auth.brandGlowBottom} />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className={auth.brandMark}>
              <Factory size={28} />
            </div>
            <div className="font-sans">
              <h1 className={auth.brandTitle}>Amirtex<span className="text-lime">OS</span></h1>
              <p className={auth.brandSubtitle}>Production Management System</p>
            </div>
          </div>
          <h2 className={auth.headline}>
            Monitor &amp; manage<br />
            your factory in real&nbsp;time
          </h2>
          <p className={`${auth.body} mt-4`}>
            Track hourly production, quality control, workforce allocation, and branch performance from a single dashboard.
          </p>
          <div className="mt-12 flex gap-10">
            <div>
              <p className={auth.stat}>20</p>
              <p className="text-muted-steel text-sm font-sans">Production Lines</p>
            </div>
            <div>
              <p className={auth.stat}>4</p>
              <p className="text-muted-steel text-sm font-sans">Branches</p>
            </div>
            <div>
              <p className={auth.stat}>12</p>
              <p className="text-muted-steel text-sm font-sans">Hourly Slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className={auth.formShell}>
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className={auth.mobileMark}>
              <Factory size={22} />
            </div>
            <h1 className="text-xl font-semibold text-ink font-serif">Amirtex<span className="text-muted">OS</span></h1>
          </div>

          <div className={auth.card}>
            <h2 className="text-xl font-semibold text-ink mb-1 font-serif">Welcome back</h2>
            <p className="text-sm text-muted mb-6 font-sans">Sign in to your account to continue</p>

            {error && (
              <div className={auth.error}>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                label="Username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                autoFocus
              />
              <Input
                label="Password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign In
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
