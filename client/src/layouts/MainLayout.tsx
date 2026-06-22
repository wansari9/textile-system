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
  separator?: boolean;
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
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'], separator: true },
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
  const isSupervisor = user?.role === 'SUPERVISOR';
  const [collapsed, setCollapsed] = useState(isSupervisor);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => allNavItems.filter(item => item.roles.includes(user?.role || 'ADMIN')), [user]);

  const pageTitle = pageTitles[location.pathname] || 'AmirtexOS';

  return (
    <div className="flex h-screen bg-greige">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-factory-night text-white transition-all duration-300
          ${collapsed ? 'w-14' : 'w-60'}
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className={`flex items-center h-14 border-b border-white/[0.08] ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'}`}>
          <Factory className="text-brand shrink-0" size={22} />
          {!collapsed && <h1 className="text-base font-semibold tracking-wide">Amirtex<span className="text-brand">OS</span></h1>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div key={item.name}>
                {item.separator && <div className="mx-4 my-2 h-px bg-white/[0.06]" />}
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`relative flex items-center gap-3 mx-2 px-3 py-2.5 rounded-md transition-all duration-150 group ${
                    isActive
                      ? 'text-white'
                      : 'text-muted-steel hover:text-white hover:bg-white/[0.06]'
                  }`}
                  title={collapsed ? item.name : undefined}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-brand rounded-r-sm" />
                  )}
                  <Icon size={18} className="shrink-0" />
                  {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-9 mx-2 mb-2 rounded-md text-muted-steel hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User info */}
        {user && (
          <div className={`border-t border-white/[0.08] ${collapsed ? 'py-3 text-center' : 'px-4 py-3'}`}>
            {collapsed ? (
              <div className="w-8 h-8 rounded-full bg-brand/80 flex items-center justify-center text-sm font-bold mx-auto">
                {user.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="text-sm min-w-0">
                  <p className="text-white font-medium truncate">{user.name}</p>
                  <p className="text-muted-steel text-xs">{user.role === 'ADMIN' ? 'Administrator' : 'Supervisor'}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand/80 flex items-center justify-center text-sm font-bold shrink-0">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className="h-14 bg-surface-raised border-b border-linen flex items-center justify-between px-4 lg:px-6 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 text-slate hover:bg-raw-cotton rounded-lg"
            >
              <Menu size={18} />
            </button>
            <div>
              <h2 className="text-base font-semibold text-ink">{pageTitle}</h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 text-cool-gray hover:text-slate hover:bg-raw-cotton rounded-lg relative" aria-label="Notifications">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-defect-red rounded-full" />
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-linen">
                <div className="w-7 h-7 rounded-full bg-brand-light text-brand flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className="text-sm leading-tight">
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-xs text-cool-gray">{user.role === 'ADMIN' ? 'Administrator' : 'Supervisor'}</p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <div className="animate-[fadeIn_150ms_ease-out]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
