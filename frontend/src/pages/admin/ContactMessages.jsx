import { useCallback, useEffect, useState } from "react";
import {
  ChevronDown,
  Loader2,
  Mail,
  MailOpen,
  Reply,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import { contactAdminApi } from "../../api/adminInboxApi";

const LIMIT = 10;

const TABS = [
  { value: "", label: "All" },
  { value: "new", label: "Unread" },
  { value: "read", label: "Read" },
];

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export default function ContactMessages() {
  const [tab, setTab] = useState("");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [state, setState] = useState({
    loading: true,
    error: "",
    messages: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    stats: { total: 0, unread: 0 },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await contactAdminApi.list({
        page,
        limit: LIMIT,
        status: tab || undefined,
        search: debounced || undefined,
      });
      setState({
        loading: false,
        error: "",
        messages: data.messages,
        pagination: data.pagination,
        stats: data.stats,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          err.response?.data?.message ||
          "Couldn’t load messages. Please try again.",
      }));
    }
  }, [page, tab, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const changeStatus = async (message, status) => {
    setBusyId(message.id);
    try {
      await contactAdminApi.setStatus(message.id, status);
      setState((prev) => ({
        ...prev,
        messages: prev.messages.map((item) =>
          item.id === message.id ? { ...item, status } : item,
        ),
        stats: {
          ...prev.stats,
          unread: Math.max(
            prev.stats.unread + (status === "new" ? 1 : -1),
            0,
          ),
        },
      }));
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Couldn’t update this message.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const toggleOpen = (message) => {
    const opening = openId !== message.id;
    setOpenId(opening ? message.id : null);
    // Opening an unread message marks it as read
    if (opening && message.status === "new") changeStatus(message, "read");
  };

  const handleDelete = async (message) => {
    if (!window.confirm(`Delete the message from ${message.name}?`)) return;

    setBusyId(message.id);
    try {
      await contactAdminApi.remove(message.id);
      toast.success("Message deleted");
      if (state.messages.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Couldn’t delete this message.",
      );
    } finally {
      setBusyId(null);
    }
  };

  const { loading, error, messages, pagination, stats } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="mt-1 text-sm text-gray-500">
          Messages sent from the Contact Us page.{" "}
          {stats.unread > 0
            ? `${stats.unread} unread.`
            : "You’re all caught up."}
        </p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-1 rounded-xl bg-gray-50 p-1">
            {TABS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  setTab(item.value);
                  setPage(1);
                }}
                className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-medium transition ${
                  tab === item.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email or subject"
              aria-label="Search messages"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
        </div>

        {error ? (
          <div className="p-8 text-center text-sm text-red-600" role="alert">
            {error}{" "}
            <button
              type="button"
              onClick={load}
              className="cursor-pointer font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : loading && messages.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading messages…
          </div>
        ) : messages.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">
            {debounced || tab
              ? "No messages match your filters."
              : "No messages yet. Anything sent from the Contact Us page will appear here."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {messages.map((message) => {
              const open = openId === message.id;
              const unread = message.status === "new";
              const replySubject = encodeURIComponent(
                `Re: ${message.subject || "Your message to SAGE"}`,
              );

              return (
                <li key={message.id}>
                  <button
                    type="button"
                    onClick={() => toggleOpen(message)}
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-start gap-3 px-4 py-4 text-left transition hover:bg-gray-50 sm:px-5"
                  >
                    <span
                      className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        unread
                          ? "bg-red-50 text-primary"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {unread ? <Mail size={17} /> : <MailOpen size={17} />}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span
                          className={`text-sm ${
                            unread
                              ? "font-bold text-gray-900"
                              : "font-medium text-gray-700"
                          }`}
                        >
                          {message.name}
                        </span>
                        {unread && (
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-white">
                            New
                          </span>
                        )}
                      </span>
                      <span className="block truncate text-sm text-gray-600">
                        {message.subject || "No subject"}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-400">
                        {formatDateTime(message.createdAt)}
                      </span>
                    </span>

                    <ChevronDown
                      size={18}
                      className={`mt-2 shrink-0 text-gray-400 transition-transform ${
                        open ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {open && (
                    <div className="border-t border-gray-50 bg-gray-50/60 px-4 py-4 sm:px-5 sm:pl-[4.25rem]">
                      <p className="text-xs text-gray-500">
                        From{" "}
                        <a
                          href={`mailto:${message.email}`}
                          className="font-medium text-secondary hover:underline"
                        >
                          {message.email}
                        </a>
                      </p>

                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-800">
                        {message.message}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <a
                          href={`mailto:${message.email}?subject=${replySubject}`}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-xs font-bold text-white transition hover:bg-primary-hover"
                        >
                          <Reply size={14} />
                          Reply by email
                        </a>

                        <button
                          type="button"
                          disabled={busyId === message.id}
                          onClick={() =>
                            changeStatus(
                              message,
                              unread ? "read" : "new",
                            )
                          }
                          className="cursor-pointer rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
                        >
                          {unread ? "Mark as read" : "Mark as unread"}
                        </button>

                        <button
                          type="button"
                          disabled={busyId === message.id}
                          onClick={() => handleDelete(message)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
