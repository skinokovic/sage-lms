import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const DashboardRedirect = () => {
  const { user, status } = useSelector((state) => state.auth);

  if (status === "checking") {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.mustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  switch (user.role) {
    case "admin":
      return <Navigate to="/dashboard/admin" replace />;

    case "instructor":
      return <Navigate to="/dashboard/instructor" replace />;

    case "student":
    default:
      return <Navigate to="/dashboard/student" replace />;
  }
};

export default DashboardRedirect;
