import { useState } from "react";
import { Star } from "lucide-react";

const LABELS = ["", "Poor", "Fair", "Good", "Very good", "Excellent"];

/** Read-only stars. Supports decimals (4.3 shows 4.3 stars filled). */
export function StarDisplay({ value = 0, size = 16, className = "" }) {
  const rating = Math.max(0, Math.min(5, Number(value) || 0));
  const stars = [0, 1, 2, 3, 4];

  return (
    <span
      role="img"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
      className={`relative inline-flex ${className}`}
    >
      <span className="flex gap-0.5 text-gray-200">
        {stars.map((i) => (
          <Star key={i} size={size} className="shrink-0 fill-current" />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-amber-400"
        style={{ width: `${(rating / 5) * 100}%` }}
      >
        {stars.map((i) => (
          <Star key={i} size={size} className="shrink-0 fill-current" />
        ))}
      </span>
    </span>
  );
}

/** Clickable 1-5 star input (radio group, keyboard accessible). */
export function StarInput({ value, onChange, label, size = 28, disabled }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  const handleKey = (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") {
      e.preventDefault();
      onChange(Math.min(5, (value || 0) + 1));
    } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
      e.preventDefault();
      onChange(Math.max(1, (value || 2) - 1));
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex flex-wrap items-center gap-1"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          disabled={disabled}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          onKeyDown={handleKey}
          className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Star
            size={size}
            className={
              n <= shown ? "fill-amber-400 text-amber-400" : "text-gray-300"
            }
          />
        </button>
      ))}
      <span className="ml-2 text-sm font-medium text-gray-600">
        {LABELS[shown] || "Select a rating"}
      </span>
    </div>
  );
}
