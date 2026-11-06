import { StarDisplay } from "./StarRating";
import { formatDate, initialsOf } from "../../utils/reviewUtils";

/** One public review: name, stars, date, optional context line and comment. */
export default function ReviewItem({ review }) {
  return (
    <article className="flex gap-4 py-5">
      <div
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-sm font-bold text-secondary"
      >
        {initialsOf(review.name)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="text-sm font-semibold text-gray-900">{review.name}</p>
          <StarDisplay value={review.rating} size={14} />
          <span className="text-xs text-gray-400">
            {formatDate(review.createdAt)}
          </span>
        </div>

        {review.context && (
          <p className="mt-0.5 text-xs text-gray-500">On “{review.context}”</p>
        )}

        {review.comment && (
          <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-gray-700">
            {review.comment}
          </p>
        )}
      </div>
    </article>
  );
}
