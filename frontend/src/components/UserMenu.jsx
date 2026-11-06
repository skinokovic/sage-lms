import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LayoutDashboard, LogOut } from "lucide-react";
import UserAvatar from "./UserAvatar";
import { getDisplayName } from "../utils/user";

export default function UserMenu({ user, onLogout, dashboardLink }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex cursor-pointer items-center gap-1.5 rounded-full p-1 pr-2 transition-colors hover:bg-surface-muted"
      >
        <UserAvatar user={user} size={34} />
        <ChevronDown
          size={16}
          className={`text-body transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-2 w-60 rounded-xl border border-line bg-surface p-2 shadow-lg"
        >
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-heading">
              {getDisplayName(user)}
            </p>
            {user.email && (
              <p className="truncate text-xs text-body">{user.email}</p>
            )}
          </div>

          {dashboardLink && (
            <Link
              to={dashboardLink}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted hover:text-primary"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-control px-3 py-2 text-sm font-medium text-heading transition-colors hover:bg-surface-muted hover:text-primary"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
