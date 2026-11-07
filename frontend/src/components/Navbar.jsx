import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Menu,
  X,
  Search,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Heart,
} from "lucide-react";
import Logo from "./Logo";
import { SecondaryButton, PrimaryButton } from "./Buttons";
import AppPromoBar from "./AppPromoBar";
import UserMenu from "./UserMenu";
import UserAvatar from "./UserAvatar";
import { logout } from "../store/authSlice"; // adjust to wherever authSlice.js lives
import { getDisplayName, getDashboardPath } from "../utils/user";
import { toast } from "react-toastify";
import useWishlistCount from "../hooks/userWishList";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Courses", to: "/courses" },
];

const desktopLinkClass = ({ isActive }) =>
  `relative cursor-pointer py-1.5 transition-colors hover:text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:rounded-full after:bg-primary after:transition-transform after:duration-200 ${
    isActive ? "text-primary after:scale-x-100" : "after:scale-x-0"
  }`;

const mobileLinkClass = ({ isActive }) =>
  `rounded-control px-2 py-2.5 transition-colors hover:bg-surface-muted ${
    isActive ? "bg-surface-muted text-primary" : ""
  }`;

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const user = useSelector((state) => state.auth.user);
  const status = useSelector((state) => state.auth.status);
  const isRestoring = status === "checking" && !user;

  // Role-based dashboard path, only meaningful once a user is loaded.
  const dashboardPath = user ? getDashboardPath(user) : null;

  const closeAll = () => {
    setMobileOpen(false);
    setSearchOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    navigate(`/courses?q=${encodeURIComponent(query.trim())}`);
    setQuery("");
    closeAll();
  };

  const handleLogout = () => {
    dispatch(logout());
    toast.success("Logout Successfully");
    closeAll();
    navigate("/");
  };

  const wishlistCount = useWishlistCount();

  const cartCount = JSON.parse(
    localStorage.getItem("sage_cart") || "[]",
  ).length;

  return (
    <>
      <AppPromoBar />
      <header className="sticky top-0 z-20 border-b border-line bg-surface">
        <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="flex shrink-0 items-center cursor-pointer"
            onClick={closeAll}
          >
            <Logo size={40} />
          </Link>

          <nav className="hidden items-center justify-center gap-10 text-[15px] font-semibold text-heading md:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.to === "/"}
                className={desktopLinkClass}
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-1">
            {/* <button
              type="button"
              onClick={() => setSearchOpen((v) => !v)}
              aria-label="Search courses"
              aria-expanded={searchOpen}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-muted"
            >
              <Search size={19} />
            </button> */}
            {user && (
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                onClick={closeAll}
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-muted"
              >
                <Heart size={19} />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                    {/* <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"> */}
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}
            <Link
              to="/cart"
              aria-label="Cart"
              onClick={closeAll}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-muted"
            >
              <ShoppingCart size={19} />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                  {/* <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-white"> */}
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Desktop account area */}
            {isRestoring && (
              <div className="hidden pl-2 md:block" aria-hidden="true">
                <span className="block h-9 w-9 animate-pulse rounded-full bg-surface-muted" />
              </div>
            )}

            {!isRestoring && user && (
              <div className="hidden pl-2 md:block">
                <UserMenu
                  user={user}
                  onLogout={handleLogout}
                  dashboardLink={dashboardPath}
                />
              </div>
            )}

            {!isRestoring && !user && (
              <div className="hidden items-center gap-3 pl-2 md:flex">
                <Link to="/login">
                  <SecondaryButton className="h-10! max-w-none! px-6! cursor-pointer">
                    Log in
                  </SecondaryButton>
                </Link>
                <Link to="/create-account">
                  <PrimaryButton className="h-10! max-w-none! px-6! cursor-pointer">
                    Get started
                  </PrimaryButton>
                </Link>
              </div>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-heading transition-colors hover:bg-surface-muted md:hidden"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Expandable search bar */}
        {searchOpen && (
          <div className="border-t border-line px-4 py-3 sm:px-6">
            <form
              onSubmit={handleSearch}
              className="mx-auto flex max-w-7xl items-center gap-2"
            >
              <input
                type="search"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search courses..."
                className="w-full rounded-control border border-line bg-surface px-4 py-2 text-sm text-heading placeholder:text-body focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
              <button
                type="submit"
                className="shrink-0 cursor-pointer rounded-control bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Search
              </button>
            </form>
          </div>
        )}

        {/* Mobile nav + account panel */}
        {mobileOpen && (
          <div className="border-t border-line px-4 py-4 md:hidden">
            {user && (
              <div className="mb-3 flex items-center gap-3 border-b border-line px-2 pb-4">
                <UserAvatar user={user} size={40} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-heading">
                    {getDisplayName(user)}
                  </p>
                  {user.email && (
                    <p className="truncate text-xs text-body">{user.email}</p>
                  )}
                </div>
              </div>
            )}

            {user && (
              <Link
                to={dashboardPath}
                onClick={closeAll}
                className="mb-1 flex items-center gap-2 rounded-control px-2 py-2.5 text-[15px] font-semibold text-heading transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <LayoutDashboard size={18} />
                Dashboard
              </Link>
            )}

            <nav className="flex flex-col gap-1 text-[15px] font-semibold text-heading">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.label}
                  to={link.to}
                  end={link.to === "/"}
                  onClick={closeAll}
                  className={mobileLinkClass}
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>

            {user && (
              <button
                type="button"
                onClick={handleLogout}
                className="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-control px-2 py-2.5 text-[15px] font-semibold text-heading transition-colors hover:bg-surface-muted hover:text-primary"
              >
                <LogOut size={18} />
                Log out
              </button>
            )}

            {!user && !isRestoring && (
              <div className="mt-4 flex flex-col gap-3">
                <Link to="/login" onClick={closeAll}>
                  <SecondaryButton className="h-11! w-full! max-w-none! cursor-pointer">
                    Log in
                  </SecondaryButton>
                </Link>
                <Link to="/create-account" onClick={closeAll}>
                  <PrimaryButton className="h-11! w-full! max-w-none! cursor-pointer">
                    Get started
                  </PrimaryButton>
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}
