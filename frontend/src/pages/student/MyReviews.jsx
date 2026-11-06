import { useCallback, useEffect, useState } from "react";
import { BookOpen, Loader2, Pencil, Star, Trash2 } from "lucide-react";
import { toast } from "react-toastify";

import { reviewApi } from "../../api/reviewApi";
import ReviewForm from "../../components/reviews/ReviewForm";
import { StarDisplay } from "../../components/reviews/StarRating";
import { errorMessage, formatDate } from "../../utils/reviewUtils";

function Thumb({ src, title }) {
  return (
    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
      {src ? (
        <img
          src={src}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-gray-300">
          <BookOpen size={20} />
        </div>
      )}
    </div>
  );
}

export default function MyReviews() {
  const [state, setState] = useState({
    loading: true,
    error: "",
    reviews: [],
    pending: [],
  });
  // Which course has its form open: { courseId } | null
  const [openForm, setOpenForm] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await reviewApi.mine();
      setState({
        loading: false,
        error: "",
        reviews: data.reviews,
        pending: data.pending,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage(err, "Couldn’t load your reviews."),
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaved = () => {
    setOpenForm(null);
    load();
  };

  const handleDelete = async (review) => {
    if (!window.confirm(`Delete your review of “${review.course.title}”?`))
      return;
    try {
      await reviewApi.remove(review.course.id);
      toast.success("Review deleted");
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t delete this review."));
    }
  };

  const { loading, error, reviews, pending } = state;

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-20 text-sm text-gray-500">
        <Loader2 size={16} className="animate-spin" /> Loading your reviews…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Reviews</h1>
        <p className="mt-1 text-sm text-gray-500">
          Rate the courses you’re enrolled in and the instructors who teach
          them.
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

      {/* Waiting for a review */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">
          Waiting for your review{pending.length > 0 && ` (${pending.length})`}
        </h2>

        {pending.length === 0 ? (
          <p className="mt-3 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            You’ve reviewed all of your courses. Nice work!
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {pending.map((course) => {
              const open = openForm?.courseId === course.id;
              return (
                <li
                  key={course.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-4">
                    <Thumb src={course.thumbnail} title={course.title} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {course.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Instructor: {course.instructorName}
                      </p>
                    </div>
                    {!open && (
                      <button
                        type="button"
                        onClick={() => setOpenForm({ courseId: course.id })}
                        className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
                      >
                        <Star size={15} /> Write review
                      </button>
                    )}
                  </div>

                  {open && (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <ReviewForm
                        courseId={course.id}
                        instructorName={course.instructorName}
                        onSaved={handleSaved}
                        onCancel={() => setOpenForm(null)}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Existing reviews */}
      <section>
        <h2 className="text-lg font-bold text-gray-900">
          Your reviews{reviews.length > 0 && ` (${reviews.length})`}
        </h2>

        {reviews.length === 0 ? (
          <p className="mt-3 rounded-xl bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Reviews you write will appear here.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.map((review) => {
              const open = openForm?.courseId === review.course.id;
              return (
                <li
                  key={review.id}
                  className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5"
                >
                  <div className="flex flex-wrap items-start gap-4">
                    <Thumb
                      src={review.course.thumbnail}
                      title={review.course.title}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">
                        {review.course.title}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-400">
                        {formatDate(review.updatedAt)}
                      </p>
                    </div>

                    {!open && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenForm({ courseId: review.course.id })
                          }
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Pencil size={13} /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(review)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    )}
                  </div>

                  {review.status === "hidden" && (
                    <p className="mt-3 text-xs text-amber-700">
                      This review is currently hidden by our team.
                    </p>
                  )}

                  {open ? (
                    <div className="mt-5 border-t border-gray-100 pt-5">
                      <ReviewForm
                        courseId={review.course.id}
                        instructorName={review.instructorName}
                        initial={review}
                        onSaved={handleSaved}
                        onCancel={() => setOpenForm(null)}
                      />
                    </div>
                  ) : (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          Course{" "}
                          <StarDisplay value={review.courseRating} size={14} />
                        </p>
                        {review.courseComment && (
                          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-gray-600">
                            {review.courseComment}
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                          {review.instructorName}{" "}
                          <StarDisplay
                            value={review.instructorRating}
                            size={14}
                          />
                        </p>
                        {review.instructorComment && (
                          <p className="mt-1.5 whitespace-pre-wrap break-words text-sm text-gray-600">
                            {review.instructorComment}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
