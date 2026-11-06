import { StarDisplay } from "./StarRating";

/** Average score plus the 5-to-1 star distribution bars. */
export default function RatingSummary({ summary, noun = "ratings" }) {
  const { average = 0, count = 0, distribution = {} } = summary || {};

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-4">
        <p className="text-5xl font-extrabold tracking-tight text-gray-900">
          {count ? average.toFixed(1) : "–"}
        </p>
        <div>
          <StarDisplay value={average} size={18} />
          <p className="mt-1 text-xs text-gray-500">
            {count} {count === 1 ? noun.replace(/s$/, "") : noun}
          </p>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => {
          const n = distribution[star] || 0;
          const pct = count ? Math.round((n / count) * 100) : 0;
          return (
            <div key={star} className="flex items-center gap-3 text-xs">
              <span className="w-8 shrink-0 text-gray-600">{star} star</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-amber-400"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right text-gray-500">
                {pct}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
