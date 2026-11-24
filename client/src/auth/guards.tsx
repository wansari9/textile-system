import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeForRole, isAdminRole, isLineManagerRole } from '../domain';
import { clearSession, getSessionUser, getToken } from '../lib/session';

const roleMatches = (required: string, actual?: string | null): boolean => {
  if (required === 'ADMIN') return isAdminRole(actual);
  if (required === 'LINE_MANAGER') return isLineManagerRole(actual);
  return required === actual;
};

/** Requires a valid token plus a known role; otherwise sends the user to login. */
export const RequireAuth = () => {
  const location = useLocation();
  const user = getSessionUser();

  if (!getToken() || !user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!isAdminRole(user.role) && !isLineManagerRole(user.role)) {
    clearSession();
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

/** Allows only the listed roles; anyone else lands on their own home page. */
export const RequireRole = ({ roles }: { roles: string[] }) => {
  const user = getSessionUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.some(role => roleMatches(role, user.role))) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }

  return <Outlet />;
};

/** Sends an already-signed-in visitor to the right landing page. */
export const HomeRedirect = () => {
  const user = getSessionUser();
  return <Navigate to={homeForRole(user?.role)} replace />;
};
