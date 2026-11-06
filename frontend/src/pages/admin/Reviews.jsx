import { useCallback, useEffect, useState } from "react";
import {
  Eye,
  EyeOff,
  Loader2,
  MessageSquare,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import { reviewAdminApi } from "../../api/reviewApi";
import { StarDisplay } from "../../components/reviews/StarRating";
import { errorMessage, formatDate } from "../../utils/reviewUtils";

const TABS = [
  { value: "", label: "All" },
  { value: "published", label: "Published" },
  { value: "hidden", label: "Hidden" },
];

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminReviews() {
  const [tab, setTab] = useState("");
  const [lowRated, setLowRated] = useState(false);
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [state, setState] = useState({
    loading: true,
    error: "",
    reviews: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    stats: { total: 0, hidden: 0, courseAverage: 0, instructorAverage: 0 },
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await reviewAdminApi.list({
        page,
        limit: 10,
        status: tab || undefined,
        lowRated: lowRated ? "true" : undefined,
      });
      setState({
        loading: false,
        error: "",
        reviews: data.reviews,
        pagination: data.pagination,
        stats: data.stats,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage(err, "Couldn’t load reviews."),
      }));
    }
  }, [page, tab, lowRated]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleHidden = async (review) => {
    const next = review.status === "hidden" ? "published" : "hidden";
    setBusyId(review.id);
    try {
      await reviewAdminApi.setStatus(review.id, next);
      toast.success(next === "hidden" ? "Review hidden" : "Review published");
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t update this review."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (review) => {
    if (
      !window.confirm(`Permanently delete the review by ${review.studentName}?`)
    )
      return;
    setBusyId(review.id);
    try {
      await reviewAdminApi.remove(review.id);
      toast.success("Review deleted");
      if (state.reviews.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t delete this review."));
    } finally {
      setBusyId(null);
    }
  };

  const { loading, error, reviews, pagination, stats } = state;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Moderate course and instructor reviews. Hidden reviews stay saved but
          no longer show publicly or count toward ratings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={MessageSquare}
          label="Total reviews"
          value={stats.total}
          tone="bg-red-50 text-primary"
        />
        <Stat
          icon={EyeOff}
          label="Hidden"
          value={stats.hidden}
          tone="bg-gray-100 text-gray-600"
        />
        <Stat
          icon={Star}
          label="Avg. course rating"
          value={stats.courseAverage || "–"}
          tone="bg-amber-50 text-amber-600"
        />
        <Stat
          icon={Star}
          label="Avg. instructor rating"
          value={stats.instructorAverage || "–"}
          tone="bg-blue-50 text-secondary"
        />
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

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={lowRated}
              onChange={(e) => {
                setLowRated(e.target.checked);
                setPage(1);
              }}
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            Low ratings only (2 stars or less)
          </label>
        </div>

        {error ? (
          <div role="alert" className="p-8 text-center text-sm text-red-600">
            {error}{" "}
            <button
              type="button"
              onClick={load}
              className="cursor-pointer font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : loading && reviews.length === 0 ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">
            No reviews match your filters.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {reviews.map((review) => {
              const hidden = review.status === "hidden";
              return (
                <li
                  key={review.id}
                  className={`p-4 sm:p-5 ${hidden ? "bg-gray-50/70" : ""}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        {review.studentName}
                        {hidden && (
                          <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                            Hidden
                          </span>
                        )}
                      </p>
                      <p className="break-all text-xs text-gray-500">
                        {review.studentEmail}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {review.courseTitle} · {review.instructorName} ·{" "}
                        {formatDate(review.createdAt)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        disabled={busyId === review.id}
                        onClick={() => toggleHidden(review)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                      >
                        {hidden ? <Eye size={13} /> : <EyeOff size={13} />}
                        {hidden ? "Publish" : "Hide"}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === review.id}
                        onClick={() => handleDelete(review)}
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        Course{" "}
                        <StarDisplay value={review.courseRating} size={13} />
                      </p>
                      {review.courseComment && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
                          {review.courseComment}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                        Instructor{" "}
                        <StarDisplay
                          value={review.instructorRating}
                          size={13}
                        />
                      </p>
                      {review.instructorComment && (
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
                          {review.instructorComment}
                        </p>
                      )}
                    </div>
                  </div>
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
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
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
