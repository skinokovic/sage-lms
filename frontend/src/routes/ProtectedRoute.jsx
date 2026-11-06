import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = () => {
  const location = useLocation();

  const { user, token, status } = useSelector((state) => state.auth);

  /*
  |--------------------------------------------------------------------------
  | Wait while restoring authentication
  |--------------------------------------------------------------------------
  */
  if (status === "checking") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />

          <p className="mt-4 text-sm text-gray-500">
            Restoring your session...
          </p>
        </div>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Not authenticated
  |--------------------------------------------------------------------------
  */
  if (!user || !token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  /*
  |--------------------------------------------------------------------------
  | Authenticated
  |--------------------------------------------------------------------------
  */
  return <Outlet />;
};

export default ProtectedRoute;
