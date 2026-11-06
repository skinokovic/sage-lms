import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardCheck,
  FileText,
  GraduationCap,
  RotateCcw,
  Users,
} from "lucide-react";

import { useSummary } from "../../context/SummaryContext";

const ICONS = {
  submission: { icon: ClipboardCheck, className: "bg-red-50 text-[#B00000]" },
  enrollment: { icon: Users, className: "bg-blue-50 text-[#1E3A8A]" },
  completion: { icon: Award, className: "bg-amber-50 text-amber-600" },
  grade: { icon: GraduationCap, className: "bg-green-50 text-green-600" },
  returned: { icon: RotateCcw, className: "bg-blue-50 text-[#1E3A8A]" },
  assignment: { icon: FileText, className: "bg-red-50 text-[#B00000]" },
  session: { icon: CalendarDays, className: "bg-purple-50 text-purple-600" },
};

const timeAgo = (iso) => {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "Africa/Lagos",
  });
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const rootRef = useRef(null);
  const [open, setOpen] = useState(false);

  const { notifications, unread, loading, markAllRead } = useSummary();

  // Close when clicking elsewhere or pressing Escape
  useEffect(() => {
    if (!open) return undefined;

    const onClick = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKey = (event) => event.key === "Escape" && setOpen(false);

    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);

    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (item) => {
    setOpen(false);
    if (item.link) navigate(item.link);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label={
          unread > 0 ? `Notifications, ${unread} unread` : "Notifications"
        }
        aria-expanded={open}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
      >
        <Bell size={21} />

        {unread > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#B00000] px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(92vw,380px)] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900">Notifications</h3>

              <p className="text-[11px] text-gray-400">
                {unread > 0 ? `${unread} unread` : "You're all caught up"}
              </p>
            </div>

            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#1E3A8A] transition hover:bg-blue-50"
              >
                <CheckCheck size={14} />
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Bell size={28} className="mx-auto text-gray-300" />

                <p className="mt-3 text-sm font-semibold text-gray-700">
                  No notifications yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  New activity will appear here automatically.
                </p>
              </div>
            ) : (
              notifications.map((item) => {
                const config = ICONS[item.type] || ICONS.assignment;
                const Icon = config.icon;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    className={`flex w-full cursor-pointer items-start gap-3 border-b border-gray-50 px-4 py-3 text-left transition last:border-b-0 hover:bg-gray-50 ${
                      item.unread ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${config.className}`}
                    >
                      <Icon size={17} />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {item.title}
                        </span>

                        <span className="shrink-0 text-[11px] text-gray-400">
                          {timeAgo(item.at)}
                        </span>
                      </span>

                      <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-500">
                        {item.message}
                      </span>
                    </span>

                    {item.unread && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#B00000]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
