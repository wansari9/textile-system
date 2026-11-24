import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
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
  Bookmark,
  LogOut,
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { addDays, toISODate } from '../lib/date';
import { layout } from '../design';
import { ROLE_LABELS, isAdminRole, isLineManagerRole } from '../domain';
import { clearSession, getSessionUser } from '../lib/session';

interface NavItem {
  name: string;
  path: string;
  icon: any;
  roles: string[];
  separator?: boolean;
}

const allNavItems: NavItem[] = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ['ADMIN'] },
  { name: 'Orders', path: '/orders', icon: Package, roles: ['ADMIN'] },
  { name: 'Production Lines', path: '/lines', icon: Factory, roles: ['ADMIN'] },
  { name: 'Daily Production', path: '/stages', icon: PackageSearch, roles: ['ADMIN'] },
  { name: 'Quality', path: '/quality', icon: ShieldCheck, roles: ['ADMIN'] },
  { name: 'Customers', path: '/customers', icon: Building2, roles: ['ADMIN'] },
  { name: 'Branches', path: '/branches', icon: GitBranch, roles: ['ADMIN'] },
  { name: 'Reports', path: '/reports', icon: BarChart3, roles: ['ADMIN'], separator: true },
  { name: 'Users', path: '/users', icon: UsersIcon, roles: ['ADMIN'] },
  { name: 'Hourly Entry', path: '/entry', icon: ClipboardList, roles: ['LINE_MANAGER', 'SUPERVISOR'] },
];

const pageTitles: Record<string, string> = {
  '/': 'Floor overview',
  '/orders': 'Orders',
  '/entry': 'Hourly Production Entry',
  '/lines': 'Production Lines',
  '/customers': 'Customers & Orders',
  '/branches': 'Satellite Branches',
  '/reports': 'Production Reports',
  '/users': 'User Management',
  '/stages': 'Daily Production',
  '/quality': 'Quality Control',
};

export default function MainLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  // Session user is guaranteed by RequireAuth; null is only a brief safety net.
  const [user] = useState(() => getSessionUser());

  const isLineManager = isLineManagerRole(user?.role);
  const [collapsed, setCollapsed] = useState(isLineManager);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(
    () => allNavItems.filter(item => item.roles.includes(user?.role || '')),
    [user]
  );
  const pageTitle = pageTitles[location.pathname] || 'AmirtexOS';
  const initial = user?.name?.charAt(0)?.toUpperCase() || 'U';

  const today = new Date();
  const savedViews = [
    { label: 'Today', date: toISODate(today) },
    { label: 'Yesterday', date: toISODate(addDays(today, -1)) },
    { label: 'A week ago', date: toISODate(addDays(today, -7)) },
  ];

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div className={layout.shell}>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-ink/30 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`${layout.sidebar} ${collapsed ? 'w-14' : 'w-60'} ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className={`${layout.brandRow} ${collapsed ? 'justify-center px-0' : 'gap-2.5 px-4'}`}>
          <div className={layout.brandMark}>
            <Factory size={17} />
          </div>
          {!collapsed && (
            <h1 className={layout.brandText}>
              Amirtex<span className="text-muted">OS</span>
            </h1>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <div key={item.name}>
                {item.separator && <div className="mx-4 my-2 h-px bg-rule" />}
                <Link
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`${layout.navLink} ${isActive ? layout.navActive : layout.navIdle}`}
                  title={collapsed ? item.name : undefined}
                >
                  <Icon size={17} className="shrink-0" />
                  {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.name}</span>}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Saved views (admin dashboard shortcuts) */}
        {!collapsed && isAdminRole(user?.role) && (
          <div className="mx-2 mb-3 rounded-xl border border-rule bg-canvas/70 p-3">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-muted">
              <Bookmark size={12} /> Saved views
            </div>
            <div className="mt-2 space-y-0.5">
              {savedViews.map((view) => {
                const active = location.pathname === '/' && location.search === `?date=${view.date}`;
                return (
                  <Link
                    key={view.label}
                    to={`/?date=${view.date}`}
                    className={`block rounded-md px-2 py-1.5 text-xs transition-colors ${
                      active ? layout.savedViewActive : layout.savedViewIdle
                    }`}
                  >
                    {view.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Collapse toggle (desktop) */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex items-center justify-center h-9 mx-2 mb-2 rounded-md text-muted hover:text-ink hover:bg-raw-cotton transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* User card — the one dark surface in the sidebar */}
        {user && (
          <div className={`border-t border-rule ${collapsed ? 'py-3' : 'p-3'}`}>
            {collapsed ? (
              <div className="w-9 h-9 rounded-full bg-ink text-lime flex items-center justify-center text-sm font-semibold mx-auto">
                {initial}
              </div>
            ) : (
              <div className={layout.userCard}>
                <div className="flex items-center gap-2.5">
                  <div className={layout.avatar}>
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-[11px] text-white/50">
                      {ROLE_LABELS[user?.role ?? ''] ?? 'User'}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="p-1.5 rounded-md text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <LogOut size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header */}
        <header className={layout.header}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className={`lg:hidden ${layout.iconButton}`}
              aria-label="Open navigation"
            >
              <Menu size={18} />
            </button>
            <h2 className={layout.pageTitle}>{pageTitle}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              className={`${layout.iconButton} relative`}
              aria-label="Notifications"
            >
              <Bell size={18} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-lime-deep rounded-full" />
            </button>
            {user && (
              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-rule">
                <div className="w-7 h-7 rounded-full bg-lime-soft text-ink flex items-center justify-center text-xs font-semibold">
                  {initial}
                </div>
                <div className="text-sm leading-tight">
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-[11px] text-muted">{ROLE_LABELS[user?.role ?? ''] ?? 'User'}</p>
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
