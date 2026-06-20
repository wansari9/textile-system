import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Factory, 
  Users as UsersIcon, 
  GitBranch, 
  Building2, 
  PackageSearch,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Production Lines', path: '/lines', icon: Factory },
    { name: 'Hourly Entry', path: '/entry', icon: ClipboardList },
    { name: 'Cutting / Packing', path: '/stages', icon: PackageSearch },
    { name: 'Quality Control', path: '/quality', icon: ShieldCheck },
    { name: 'Branches', path: '/branches', icon: GitBranch },
    { name: 'Customers', path: '/customers', icon: Building2 },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
    { name: 'Users', path: '/users', icon: UsersIcon },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col">
        <div className="p-4 flex items-center gap-3 border-b border-slate-700">
          <Factory className="text-blue-400" size={28} />
          <h1 className="text-xl font-bold tracking-wide">Amirtex<span className="text-blue-400">OS</span></h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        <Outlet /> {/* This is where our pages will render! */}
      </main>
    </div>
  );
}