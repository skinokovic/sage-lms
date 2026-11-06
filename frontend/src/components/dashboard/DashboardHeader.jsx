import { useEffect, useState } from "react";
import { Bell, Clock, Menu, Search } from "lucide-react";
import NotificationBell from "./NotificationBell";

const DashboardHeader = ({ title, subtitle, user, onMenuClick }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });

  const timeLabel = now.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const initials =
    user?.name
      ?.split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-18 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-gray-600 transition hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu size={23} />
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-gray-900 sm:text-2xl">
              {title}
            </h1>

            {subtitle && (
              <p className="hidden truncate text-xs text-gray-500 sm:block">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden items-center gap-2 rounded-xl bg-[#1E3A8A] px-3 py-2 text-white md:flex">
            <Clock size={15} className="text-blue-200" />

            <span className="text-xs font-semibold tabular-nums">
              <span className="hidden text-blue-200 lg:inline">
                {dateLabel},{" "}
              </span>
              {timeLabel}
            </span>
          </div>

          <div className="hidden items-center rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 md:flex">
            <Search size={17} className="text-gray-400" />

            <input
              type="text"
              placeholder="Search..."
              className="ml-2 w-32 bg-transparent text-sm outline-none placeholder:text-gray-400 lg:w-48"
            />
          </div>

          <NotificationBell />

          <div className="flex items-center gap-2">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                {initials}
              </div>
            )}

            <div className="hidden lg:block">
              <p className="max-w-32 truncate text-sm font-semibold text-gray-800">
                {user?.name || "User"}
              </p>

              <p className="text-[11px] capitalize text-gray-400">
                {user?.role || "user"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
