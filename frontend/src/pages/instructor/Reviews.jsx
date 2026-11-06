import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { reviewApi } from "../../api/reviewApi";
import RatingSummary from "../../components/reviews/RatingSummary";
import { StarDisplay } from "../../components/reviews/StarRating";
import { errorMessage, formatDate, initialsOf } from "../../utils/reviewUtils";

export default function InstructorReviews() {
  const [course, setCourse] = useState("");
  const [page, setPage] = useState(1);
  const [state, setState] = useState({
    loading: true,
    error: "",
    courseSummary: null,
    instructorSummary: null,
    byCourse: [],
    reviews: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await reviewApi.received({
        page,
        limit: 10,
        course: course || undefined,
      });
      setState({
        loading: false,
        error: "",
        courseSummary: data.courseSummary,
        instructorSummary: data.instructorSummary,
        byCourse: data.byCourse,
        reviews: data.reviews,
        pagination: data.pagination,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage(err, "Couldn’t load your reviews."),
      }));
    }
  }, [page, course]);

  useEffect(() => {
    load();
  }, [load]);

  const {
    loading,
    error,
    courseSummary,
    instructorSummary,
    byCourse,
    reviews,
    pagination,
  } = state;
  const hasAny = (instructorSummary?.count || 0) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          What students say about your courses and your teaching.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {loading && !courseSummary ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : !hasAny && !course ? (
        <p className="rounded-2xl bg-gray-50 px-4 py-12 text-center text-sm text-gray-500">
          No reviews yet. They’ll appear here once enrolled students rate your
          courses.
        </p>
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                Your courses
              </p>
              <RatingSummary summary={courseSummary} noun="ratings" />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">
                You as an instructor
              </p>
              <RatingSummary summary={instructorSummary} noun="ratings" />
            </div>
          </div>

          {byCourse.length > 0 && (
            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm font-bold text-gray-900">By course</p>
              <ul className="mt-3 divide-y divide-gray-100">
                {byCourse.map((row) => (
                  <li
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 py-3"
                  >
                    <span className="min-w-0 truncate text-sm text-gray-800">
                      {row.title}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-gray-500">
                      <StarDisplay value={row.average} size={14} />
                      {row.average.toFixed(1)} ({row.count})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-gray-100 p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-bold text-gray-900">All reviews</p>
              <select
                value={course}
                onChange={(e) => {
                  setCourse(e.target.value);
                  setPage(1);
                }}
                aria-label="Filter by course"
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                <option value="">All courses</option>
                {byCourse.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                  </option>
                ))}
              </select>
            </div>

            {reviews.length === 0 ? (
              <p className="p-8 text-center text-sm text-gray-500">
                No reviews to show.
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {reviews.map((review) => (
                  <li key={review.id} className="flex gap-4 p-4 sm:p-5">
                    <div
                      aria-hidden="true"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary"
                    >
                      {initialsOf(review.name)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {review.name}{" "}
                        <span className="font-normal text-gray-400">
                          · {formatDate(review.createdAt)}
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        {review.courseTitle}
                      </p>

                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                            Course{" "}
                            <StarDisplay
                              value={review.courseRating}
                              size={13}
                            />
                          </p>
                          {review.courseComment && (
                            <p className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-600">
                              {review.courseComment}
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                            You{" "}
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
                    </div>
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
        </>
      )}
    </div>
  );
}
