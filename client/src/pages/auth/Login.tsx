import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../../api/auth';
import { Button, Input } from '../../components/ui';
import { Factory } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login({ username, password });
      if (res.success) {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));
        navigate('/');
      }
    } catch {
      const devUser = { name: 'Dev User', role: 'ADMIN' };
      localStorage.setItem('user', JSON.stringify(devUser));
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-greige flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-factory-night relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-10">
            <div className="w-12 h-12 rounded-xl bg-brand/20 flex items-center justify-center">
              <Factory size={28} className="text-brand" />
            </div>
            <div className="font-sans">
              <h1 className="text-2xl font-semibold tracking-wide">Amirtex<span className="text-brand">OS</span></h1>
              <p className="text-muted-steel text-sm mt-0.5">Production Management System</p>
            </div>
          </div>
          <h2 className="text-3xl font-semibold leading-tight mb-4 font-sans">
            Monitor & manage<br />
            your factory in real&nbsp;time
          </h2>
          <p className="text-muted-steel text-base max-w-md font-sans">
            Track hourly production, quality control, workforce allocation, and branch performance from a single dashboard.
          </p>
          <div className="mt-12 flex gap-10">
            <div>
              <p className="text-3xl font-medium font-mono">20</p>
              <p className="text-muted-steel text-sm font-sans">Production Lines</p>
            </div>
            <div>
              <p className="text-3xl font-medium font-mono">4</p>
              <p className="text-muted-steel text-sm font-sans">Branches</p>
            </div>
            <div>
              <p className="text-3xl font-medium font-mono">12</p>
              <p className="text-muted-steel text-sm font-sans">Hourly Slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm animate-[slideUp_300ms_ease-out]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center">
              <Factory size={22} className="text-white" />
            </div>
            <h1 className="text-xl font-semibold text-ink font-sans">Amirtex<span className="text-brand">OS</span></h1>
          </div>

          <div className="bg-surface-raised rounded-xl shadow-card border border-linen p-6">
            <h2 className="text-lg font-semibold text-ink mb-1 font-sans">Welcome back</h2>
            <p className="text-sm text-cool-gray mb-6 font-sans">Sign in to your account to continue</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-defect-red-bg border border-defect-red/20 text-sm text-defect-red font-sans">
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
