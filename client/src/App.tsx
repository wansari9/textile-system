import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/admin/dashboard';
import HourlyEntry from './pages/supervisor/HourlyEntry';
import Login from './pages/auth/Login';
import Lines from './pages/admin/Lines';
import Customers from './pages/admin/Customers';
import Branches from './pages/admin/Branches';
import Reports from './pages/admin/Reports';
import Users from './pages/admin/Users';
import ProcessStages from './pages/supervisor/ProcessStages';
import Quality from './pages/supervisor/Quality';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="entry" element={<HourlyEntry />} />
          <Route path="lines" element={<Lines />} />
          <Route path="customers" element={<Customers />} />
          <Route path="branches" element={<Branches />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<Users />} />
          <Route path="stages" element={<ProcessStages />} />
          <Route path="quality" element={<Quality />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;