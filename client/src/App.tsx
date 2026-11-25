import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/admin/Dashboard';
import HourlyEntry from './pages/supervisor/HourlyEntry';
import Login from './pages/auth/Login';
import Lines from './pages/admin/Lines';
import Orders from './pages/admin/Orders';
import Customers from './pages/admin/Customers';
import Branches from './pages/admin/Branches';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';
import ProcessStages from './pages/supervisor/ProcessStages';
import Quality from './pages/supervisor/Quality';
import { ToastProvider } from './components/ui/Toast';
import { HomeRedirect, RequireAuth, RequireRole } from './auth/guards';

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<RequireAuth />}>
            <Route path="/" element={<MainLayout />}>
              {/* Shared: admins and line managers */}
              <Route element={<RequireRole roles={['ADMIN', 'LINE_MANAGER']} />}>
                <Route path="entry" element={<HourlyEntry />} />
              </Route>

              {/* Admin-only pages */}
              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="lines" element={<Lines />} />
                <Route path="stages" element={<ProcessStages />} />
                <Route path="quality" element={<Quality />} />
                <Route path="customers" element={<Customers />} />
                <Route path="branches" element={<Branches />} />
                <Route path="reports" element={<Reports />} />
                <Route path="users" element={<Users />} />
              </Route>

              {/* Legacy /products links redirect to the Orders page. */}
              <Route path="products" element={<Navigate to="/orders" replace />} />

              <Route path="*" element={<HomeRedirect />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
