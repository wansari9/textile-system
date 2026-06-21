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
  ShieldCheck,
  Package,
  ChevronLeft,
  ChevronRight,
  Bell,
  Menu,
} from 'lucide-react';
import { useState, useMemo } from 'react';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles: string[];
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN', 'SUPERVISOR'] },
  { name: 'Production Lines', path: '/lines', icon: Factory, roles: ['ADMIN'] },
  { name: 'Hourly Entry', path: '/entry', icon: ClipboardList, roles: ['ADMIN', 'SUPERVISOR'] },
  { name: 'Cutting / Packing', path: '/stages', icon: PackageSearch, roles: ['ADMIN', 'SUPERVISOR'] },
  { name: 'Quality Control', path: '/quality', icon: ShieldCheck, roles: ['ADMIN', 'SUPERVISOR'] },
  { name: 'Branches', path: '/branches', icon: GitBranch, roles: ['ADMIN'] },
  { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN'] },
  { name: 'Customers', path: '/customers', icon: Building2, roles: ['ADMIN'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'] },
  { name: 'Users', path: '/users', icon: UsersIcon, roles: ['ADMIN'] },
];

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/entry': 'Hourly Production Entry',
  '/lines': 'Production Lines',
  '/products': 'Products',
  '/customers': 'Customers & Products',
  '/branches': 'Satellite Branches',
  '/reports': 'Production Reports',
  '/users': 'User Management',
  '/stages': 'Process Stages',
  '/quality': 'Quality Control',
};

export default function MainLayout() {
  const location = useLocation();
  const [user] = useState<any>({ name: 'Dev User', role: 'ADMIN' });
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => allNavItems, []);

  const pageTitle = pageTitles[location.pathname] || 'AmirtexOS';

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-sidebar text-white transition-all duration-300
          ${collapsed ? 'w-16' : 'w-64'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-16 px-4 border-b border-white/10 ${collapsed ? 'justify-center' : 'gap-3'}`}>
          <Factory className="text-brand-400 shrink-0" size={28} />
          {!collapsed && <h1 className="text-xl font-bold tracking-wide">Amirtex<span className="text-brand-400">OS</span></h1>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative ${
                  isActive
                    ? 'bg-sidebar-active text-white'
                    : 'text-sidebar-text hover:bg-sidebar-hover hover:text-white'
                }`}
                title={collapsed ? item.name : undefined}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-400 rounded-r-full" />
                )}
                <Icon size={20} className="shrink-0" />
                {!collapsed && <span className="font-medium text-sm whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-10 mx-3 mb-2 rounded-lg text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {/* User info */}
        {user && (
          <div className={`p-4 border-t border-white/10 ${collapsed ? 'text-center' : ''}`}>
            {collapsed ? (
              <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold mx-auto">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm min-w-0">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  <p className="text-sidebar-text text-xs">{user.role}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-sm font-bold">
                  D
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-16 bg-white border-b border-border flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
            >
              <Menu size={20} />
            </button>
            <div>
              <h2 className="text-lg font-bold text-text-primary">{pageTitle}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
            </button>
            {/* Desktop user badge */}
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-border">
                <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-sm">
                  <p className="font-medium text-text-primary leading-tight">{user.name}</p>
                  <p className="text-xs text-text-muted">{user.role === 'ADMIN' ? 'Administrator' : 'Supervisor'}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
