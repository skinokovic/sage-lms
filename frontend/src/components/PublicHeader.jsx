import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { LayoutDashboard, LogOut } from "lucide-react";

import { logout } from "../store/authSlice";

const PublicHeader = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, status } = useSelector((state) => state.auth);

  // A saved login is still being checked, so don't flash the wrong buttons
  const checking = !user && status === "checking";

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#B00000] flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>

            <div>
              <span className="text-xl font-bold text-gray-900">SAGE</span>
              <span className="text-xl font-bold text-[#B00000]">LMS</span>
            </div>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center gap-7 text-sm">
            <Link
              to="/"
              className="text-gray-600 hover:text-[#B00000] transition"
            >
              Home
            </Link>

            <Link
              to="/courses"
              className="text-gray-600 hover:text-[#B00000] transition"
            >
              Courses
            </Link>

            {checking ? null : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 text-gray-600 hover:text-[#B00000] transition"
                >
                  <LayoutDashboard size={16} />
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex cursor-pointer items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 hover:text-[#B00000] transition"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-[#B00000] transition"
                >
                  Login
                </Link>

                <Link
                  to="/create-account"
                  className="px-4 py-2 rounded-lg bg-[#B00000] text-white font-medium hover:bg-red-800 transition"
                >
                  Get Started
                </Link>
              </>
            )}
          </nav>

          {/* Mobile actions */}
          <div className="md:hidden flex items-center gap-2">
            {checking ? null : user ? (
              <>
                <Link
                  to="/dashboard"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
                >
                  Dashboard
                </Link>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-2 rounded-lg bg-[#B00000] text-white text-sm font-medium"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium"
                >
                  Login
                </Link>

                <Link
                  to="/create-account"
                  className="px-3 py-2 rounded-lg bg-[#B00000] text-white text-sm font-medium"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
