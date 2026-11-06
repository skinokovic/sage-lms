import { ArrowDownRight, ArrowUpRight, MoreHorizontal } from "lucide-react";

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendType = "up",
}) => {
  const isPositive = trendType === "up";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-secondary">
          {Icon && <Icon size={23} strokeWidth={2} />}
        </div>

        <button
          type="button"
          className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <MoreHorizontal size={20} />
        </button>
      </div>

      <div className="mt-5">
        <p className="text-sm font-medium text-gray-500">{title}</p>

        <div className="mt-1 flex items-end gap-3">
          <h3 className="text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </h3>

          {trend && (
            <span
              className={`mb-1 inline-flex items-center gap-0.5 text-xs font-semibold ${
                isPositive ? "text-green-600" : "text-red-600"
              }`}
            >
              {isPositive ? (
                <ArrowUpRight size={14} />
              ) : (
                <ArrowDownRight size={14} />
              )}

              {trend}
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs text-gray-400">{description}</p>
        )}
      </div>
    </div>
  );
};

export default StatCard;
