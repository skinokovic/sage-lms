import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

const RoleProtectedRoute = ({ allowedRoles }) => {
  const { user } = useSelector((state) => state.auth);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "admin") {
      return <Navigate to="/dashboard/admin" replace />;
    }

    if (user.role === "instructor") {
      return <Navigate to="/dashboard/instructor" replace />;
    }

    return <Navigate to="/dashboard/student" replace />;
  }

  return <Outlet />;
};

export default RoleProtectedRoute;
