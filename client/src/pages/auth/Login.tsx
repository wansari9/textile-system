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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-brand-700 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-brand-400 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Factory size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-wide">Amirtex<span className="text-brand-300">OS</span></h1>
              <p className="text-brand-200 text-sm mt-1">Production Management System</p>
            </div>
          </div>
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Monitor & manage<br />
            your factory in real&nbsp;time
          </h2>
          <p className="text-brand-200 text-lg max-w-md">
            Track hourly production, quality control, workforce allocation, and branch performance from a single dashboard.
          </p>
          <div className="mt-12 flex gap-8">
            <div>
              <p className="text-3xl font-bold">20</p>
              <p className="text-brand-300 text-sm">Production Lines</p>
            </div>
            <div>
              <p className="text-3xl font-bold">4</p>
              <p className="text-brand-300 text-sm">Branches</p>
            </div>
            <div>
              <p className="text-3xl font-bold">12</p>
              <p className="text-brand-300 text-sm">Hourly Slots</p>
            </div>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm animate-[slideUp_300ms_ease-out]">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center">
              <Factory size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">Amirtex<span className="text-brand-600">OS</span></h1>
          </div>

          <div className="bg-white rounded-xl shadow-card border border-border p-6">
            <h2 className="text-xl font-bold text-text-primary mb-1">Welcome back</h2>
            <p className="text-sm text-text-muted mb-6">Sign in to your account to continue</p>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-danger-50 border border-danger-500/20 text-sm text-danger-700">
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
