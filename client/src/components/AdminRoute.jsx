import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/**
 * Route guard for the admin-only sections of /dash.
 *
 * The server is the authority here - /users, /admin/* and the dependency
 * endpoints all sit behind verifyAdmin, so a non-admin who reaches these
 * screens gets a 403 and an error panel rather than anyone else's data. This
 * guard exists so they do not reach a dead screen in the first place: before
 * the server was locked down, /dash/users happily rendered every account's
 * email to any signed-in user, and the client router still had no notion that
 * these routes were privileged at all.
 *
 * Redirects rather than rendering a "forbidden" page, because a user who lands
 * here has almost always mistyped a URL or followed a stale link - there is
 * nothing for them to do on the page itself.
 */
const AdminRoute = ({ children }) => {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'admin') {
    return <Navigate to="/dash" replace />;
  }

  return children || <Outlet />;
};

export default AdminRoute;
