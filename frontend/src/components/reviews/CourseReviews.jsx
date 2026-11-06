import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Loader2, Pencil, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { reviewApi } from "../../api/reviewApi";
import RatingSummary from "./RatingSummary";
import ReviewForm from "./ReviewForm";
import ReviewItem from "./ReviewItem";
import { StarDisplay } from "./StarRating";
import { errorMessage } from "../../utils/reviewUtils";

/**
 * Reviews section for the public course page.
 *   <CourseReviews courseId={course.id} instructorName={course.instructor?.name} />
 * Shows the rating summary and published reviews to everyone, and lets an
 * enrolled student write, edit or delete their own review.
 */
export default function CourseReviews({ courseId, instructorName }) {
  const user = useSelector((state) => state.auth.user);
  const isStudent = user?.role === "student";

  const [sort, setSort] = useState("newest");
  const [list, setList] = useState({
    loading: true,
    error: "",
    summary: null,
    reviews: [],
    pagination: { page: 1, totalPages: 1 },
  });
  const [loadingMore, setLoadingMore] = useState(false);

  const [mine, setMine] = useState({
    loaded: false,
    eligible: false,
    reason: "",
    review: null,
  });
  const [editing, setEditing] = useState(false);

  const loadList = useCallback(async () => {
    setList((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await reviewApi.forCourse(courseId, { sort, page: 1 });
      setList({
        loading: false,
        error: "",
        summary: data.summary,
        reviews: data.reviews,
        pagination: data.pagination,
      });
    } catch (err) {
      setList((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage(err, "Couldn’t load reviews."),
      }));
    }
  }, [courseId, sort]);

  const loadMine = useCallback(async () => {
    if (!isStudent) return;
    try {
      const { data } = await reviewApi.myForCourse(courseId);
      setMine({
        loaded: true,
        eligible: data.eligible,
        reason: data.reason,
        review: data.review,
      });
    } catch {
      setMine({ loaded: true, eligible: false, reason: "", review: null });
    }
  }, [courseId, isStudent]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    loadMine();
  }, [loadMine]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const { data } = await reviewApi.forCourse(courseId, {
        sort,
        page: list.pagination.page + 1,
      });
      setList((prev) => ({
        ...prev,
        reviews: [...prev.reviews, ...data.reviews],
        pagination: data.pagination,
      }));
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t load more reviews."));
    } finally {
      setLoadingMore(false);
    }
  };

  const handleSaved = () => {
    setEditing(false);
    loadMine();
    loadList();
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete your review?")) return;
    try {
      await reviewApi.remove(courseId);
      toast.success("Review deleted");
      setEditing(false);
      loadMine();
      loadList();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t delete your review."));
    }
  };

  const { loading, error, summary, reviews, pagination } = list;
  const hasMore = pagination.page < pagination.totalPages;

  return (
    <section id="reviews" aria-labelledby="reviews-heading" className="py-8">
      <h2
        id="reviews-heading"
        className="text-2xl font-bold tracking-tight text-gray-900"
      >
        Student reviews
      </h2>

      {/* Write / edit your own review */}
      {isStudent && mine.loaded && (
        <div className="mt-6">
          {mine.eligible ? (
            mine.review && !editing ? (
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      Your review
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-gray-600">
                      <span className="inline-flex items-center gap-2">
                        Course{" "}
                        <StarDisplay
                          value={mine.review.courseRating}
                          size={14}
                        />
                      </span>
                      <span className="inline-flex items-center gap-2">
                        Instructor{" "}
                        <StarDisplay
                          value={mine.review.instructorRating}
                          size={14}
                        />
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditing(true)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>

                {mine.review.status === "hidden" && (
                  <p className="mt-3 text-xs text-amber-700">
                    Your review is currently hidden by our team, so others can’t
                    see it.
                  </p>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
                <h3 className="mb-4 text-base font-bold text-gray-900">
                  {mine.review ? "Edit your review" : "Write a review"}
                </h3>
                <ReviewForm
                  courseId={courseId}
                  instructorName={instructorName}
                  initial={mine.review}
                  onSaved={handleSaved}
                  onCancel={mine.review ? () => setEditing(false) : undefined}
                />
              </div>
            )
          ) : (
            mine.reason && (
              <p className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                {mine.reason}
              </p>
            )
          )}
        </div>
      )}

      {/* Public reviews */}
      <div className="mt-8">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading reviews…
          </div>
        ) : error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : summary?.count === 0 ? (
          <p className="rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            No reviews yet. Enrolled students can be the first to share their
            experience.
          </p>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <RatingSummary summary={summary} noun="reviews" />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {summary.count} {summary.count === 1 ? "review" : "reviews"}
                </p>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="review-sort"
                    className="text-sm text-gray-600"
                  >
                    Sort by
                  </label>
                  <select
                    id="review-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
                  >
                    <option value="newest">Newest</option>
                    <option value="highest">Highest rated</option>
                    <option value="lowest">Lowest rated</option>
                  </select>
                </div>
              </div>

              <div className="mt-2 divide-y divide-gray-100">
                {reviews.map((review) => (
                  <ReviewItem key={review.id} review={review} />
                ))}
              </div>

              {hasMore && (
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  {loadingMore && (
                    <Loader2 size={15} className="animate-spin" />
                  )}
                  Show more reviews
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
