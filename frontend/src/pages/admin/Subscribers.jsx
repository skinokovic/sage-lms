import { useCallback, useEffect, useState } from "react";
import { Loader2, Mail, Search, Trash2, TrendingUp } from "lucide-react";
import { toast } from "react-toastify";

import { subscriberAdminApi } from "../../api/adminInboxApi";

const LIMIT = 15;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "-";

export default function Subscribers() {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState(null);
  const [state, setState] = useState({
    loading: true,
    error: "",
    subscribers: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    stats: { total: 0, thisMonth: 0 },
  });

  // Wait for the admin to stop typing before searching
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
      const { data } = await subscriberAdminApi.list({
        page,
        limit: LIMIT,
        search: debounced || undefined,
      });
      setState({
        loading: false,
        error: "",
        subscribers: data.subscribers,
        pagination: data.pagination,
        stats: data.stats,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error:
          err.response?.data?.message ||
          "Couldn’t load subscribers. Please try again.",
      }));
    }
  }, [page, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (subscriber) => {
    if (!window.confirm(`Remove ${subscriber.email} from the list?`)) return;

    setDeletingId(subscriber.id);
    try {
      await subscriberAdminApi.remove(subscriber.id);
      toast.success("Subscriber removed");
      if (state.subscribers.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Couldn’t remove this subscriber.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  const { loading, error, subscribers, pagination, stats } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Subscribers</h1>
        <p className="mt-1 text-sm text-gray-500">
          People who signed up for updates from the website footer.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary">
            <Mail size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-sm text-gray-500">Total subscribers</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">
              {stats.thisMonth}
            </p>
            <p className="text-sm text-gray-500">New this month</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="relative max-w-sm">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by email"
              aria-label="Search subscribers by email"
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
        ) : loading && subscribers.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Loading subscribers…
          </div>
        ) : subscribers.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">
            {debounced
              ? "No subscribers match your search."
              : "No one has subscribed yet. New sign-ups from the footer will appear here."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {subscribers.map((subscriber) => (
              <li
                key={subscriber.id}
                className="flex flex-col gap-2 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {subscriber.email}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Subscribed {formatDate(subscriber.subscribedAt)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(subscriber)}
                  disabled={deletingId === subscriber.id}
                  className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-60"
                >
                  {deletingId === subscriber.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Remove
                </button>
              </li>
            ))}
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
