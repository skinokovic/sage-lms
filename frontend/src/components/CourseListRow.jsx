import { Link } from "react-router-dom";
import { Star } from "lucide-react";

const BADGE_STYLES = {
  hot: "bg-primary text-white",
  premium: "bg-heading text-white",
};

/**
 * Horizontal row layout for a course — used on the Courses page when
 * "List" view is selected (grid view reuses CourseCard instead).
 */
export default function CourseListRow({
  id,
  title,
  instructor,
  image,
  badge,
  bestseller = false,
  rating,
  reviews,
  price,
  originalPrice,
}) {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:flex-row sm:items-center">
      <Link
        to={`/courses/${id}`}
        className="relative block h-40 w-full shrink-0 overflow-hidden rounded-lg sm:h-20 sm:w-32"
      >
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
        {badge && (
          <span
            className={`absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
              BADGE_STYLES[badge.tone] ?? BADGE_STYLES.hot
            }`}
          >
            {badge.label}
          </span>
        )}
      </Link>

      <div className="min-w-0 flex-1">
        <Link to={`/courses/${id}`}>
          <h3 className="font-semibold text-heading">{title}</h3>
        </Link>
        <p className="text-sm text-body">{instructor}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-body">
          {bestseller && (
            <span className="rounded bg-emerald-50 px-2 py-0.5 font-semibold text-emerald-700">
              Bestseller
            </span>
          )}
          {typeof rating === "number" && (
            <span className="flex items-center gap-1 font-semibold text-heading">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {rating.toFixed(1)}
            </span>
          )}
          {typeof reviews === "number" && (
            <span>({reviews.toLocaleString()} ratings)</span>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-center">
        <div className="flex items-baseline gap-2">
          <span className="font-bold text-heading">
            ₦{price?.toLocaleString()}
          </span>
          {originalPrice && (
            <span className="text-xs text-body line-through">
              ₦{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <Link
          to={`/courses/${id}`}
          className="shrink-0 cursor-pointer rounded-control border border-primary px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
        >
          Course info
        </Link>
      </div>
    </div>
  );
}
