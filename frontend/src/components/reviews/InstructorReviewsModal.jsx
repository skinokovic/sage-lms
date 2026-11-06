import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

import { reviewApi } from "../../api/reviewApi";
import RatingSummary from "./RatingSummary";
import ReviewItem from "./ReviewItem";
import { errorMessage } from "../../utils/reviewUtils";

/** Popup listing the reviews students have left for one instructor. */
export default function InstructorReviewsModal({ instructor, onClose }) {
  const [state, setState] = useState({
    loading: true,
    error: "",
    summary: null,
    reviews: [],
  });

  useEffect(() => {
    let cancelled = false;

    reviewApi
      .forInstructor(instructor.id, { limit: 30 })
      .then(({ data }) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: "",
            summary: data.summary,
            reviews: data.reviews,
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: errorMessage(err, "Couldn’t load reviews."),
            summary: null,
            reviews: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [instructor.id]);

  // Close on Escape and stop the page scrolling behind the dialog
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const { loading, error, summary, reviews } = state;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 sm:items-center sm:p-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Reviews for ${instructor.name}`}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">
            Reviews for {instructor.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto px-5 py-5 sm:px-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" /> Loading…
            </div>
          ) : error ? (
            <p role="alert" className="py-6 text-center text-sm text-red-600">
              {error}
            </p>
          ) : (
            <>
              <RatingSummary summary={summary} noun="ratings" />
              {reviews.length > 0 && (
                <div className="mt-4 divide-y divide-gray-100">
                  {reviews.map((review) => (
                    <ReviewItem key={review.id} review={review} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
