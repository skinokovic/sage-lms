import { useState } from "react";
import { X, LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { NavLink, Link } from "react-router-dom";

import Logo from "../Logo";

const Sidebar = ({
  navItems = [],
  user,
  isOpen,
  onClose,
  onLogout,
  collapsed = false,
  onToggleCollapse,
}) => {
  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <>
      {/* =========================================================
          MOBILE OVERLAY
      ========================================================= */}
      {isOpen && (
        <button
          type="button"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="Close sidebar"
        />
      )}

      {/* =========================================================
          SIDEBAR
      ========================================================= */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col
          bg-secondary text-white shadow-xl
          transition-all duration-300

          lg:translate-x-0

          ${collapsed ? "lg:w-20" : "lg:w-72"}

          ${isOpen ? "translate-x-0 w-72" : "-translate-x-full"}
        `}
      >
        {/* =======================================================
            DESKTOP COLLAPSE HANDLE
            Floats on the sidebar's edge, independent of the logo
            row, so the two never compete for space.
        ======================================================= */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="
            absolute -right-3 top-1/2 z-10 hidden h-7 w-7
            -translate-y-1/2 items-center justify-center
            rounded-full border border-gray-200 bg-white
            text-gray-500 shadow-md transition
            hover:text-secondary hover:shadow-lg
            lg:flex
          "
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* =======================================================
            LOGO / TOP BAR
        ======================================================= */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          {/* Full logo — mobile always, desktop while expanded */}
          <Link
            to="/"
            onClick={onClose}
            className={`min-w-0 ${collapsed ? "lg:hidden" : ""}`}
          >
            <Logo variant="light" size={38} />
          </Link>

          {/* Icon-only logo — desktop, collapsed only */}
          {collapsed && (
            <Link
              to="/"
              onClick={onClose}
              className="hidden w-full items-center justify-center lg:flex"
              title="SAGE LMS"
            >
              <Logo variant="light" size={34} iconOnly />
            </Link>
          )}

          {/* Mobile close button */}
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={21} />
          </button>
        </div>

        {/* =======================================================
            USER
        ======================================================= */}
        <div
          className={`
            border-b border-white/10
            ${collapsed ? "lg:p-3" : "p-4"}
          `}
        >
          <div
            className={`
              flex items-center rounded-xl bg-white/10
              ${collapsed ? "lg:justify-center lg:p-2" : "gap-3 p-3"}
            `}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-10 w-10 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className="
                  flex h-10 w-10 shrink-0 items-center
                  justify-center rounded-full bg-white
                  text-sm font-bold text-secondary
                "
              >
                {initials}
              </div>
            )}

            <div
              className={`
                min-w-0
                ${collapsed ? "lg:hidden" : ""}
              `}
            >
              <p className="truncate text-sm font-semibold">
                {user?.name || "User"}
              </p>

              <p className="truncate text-xs capitalize text-blue-200">
                {user?.role || "user"}
              </p>
            </div>
          </div>
        </div>

        {/* =======================================================
            NAVIGATION
        ======================================================= */}
        <nav
          className={`
            flex-1 overflow-y-auto overflow-x-hidden py-5
            ${collapsed ? "lg:px-2" : "px-3"}
          `}
        >
          <p
            className={`
              mb-3 px-3 text-[10px] font-bold
              uppercase tracking-[0.2em] text-blue-300
              ${collapsed ? "lg:hidden" : ""}
            `}
          >
            Main menu
          </p>

          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;

              const base = item.path.replace(/\/$/, "");

              const hasNestedSibling = navItems.some(
                (other) =>
                  other.path !== item.path && other.path.startsWith(`${base}/`),
              );

              const end = item.end ?? hasNestedSibling;

              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={end}
                  onClick={onClose}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `
                    flex items-center rounded-xl
                    text-sm font-medium transition

                    ${
                      collapsed
                        ? "lg:justify-center lg:px-3 lg:py-3"
                        : "gap-3 px-3 py-3"
                    }

                    ${
                      isActive
                        ? "bg-white text-secondary shadow-sm"
                        : "text-blue-100 hover:bg-white/10 hover:text-white"
                    }
                    `
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        size={19}
                        strokeWidth={isActive ? 2.5 : 2}
                        className="shrink-0"
                      />

                      <span
                        className={`
                          truncate
                          ${collapsed ? "lg:hidden" : ""}
                        `}
                      >
                        {item.label}
                      </span>

                      {item.badge && (
                        <span
                          className={`
                            ml-auto rounded-full px-2 py-0.5
                            text-[10px] font-bold
                            ${collapsed ? "lg:hidden" : ""}
                            ${
                              isActive
                                ? "bg-primary text-white"
                                : "bg-white/15 text-white"
                            }
                          `}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* =======================================================
            LOGOUT
        ======================================================= */}
        <div
          className={`
            border-t border-white/10
            ${collapsed ? "lg:p-2" : "p-3"}
          `}
        >
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? "Sign out" : undefined}
            className={`
              flex w-full items-center
              rounded-xl text-sm font-medium
              text-blue-100 transition
              hover:bg-white/10 hover:text-white

              ${
                collapsed
                  ? "lg:justify-center lg:px-3 lg:py-3"
                  : "gap-3 px-3 py-3"
              }
            `}
          >
            <LogOut size={19} className="shrink-0" />

            <span
              className={`
                ${collapsed ? "lg:hidden" : ""}
              `}
            >
              Sign out
            </span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
