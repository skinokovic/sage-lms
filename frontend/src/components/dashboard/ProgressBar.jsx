const ProgressBar = ({ value = 0, label, showValue = true, size = "md" }) => {
  const safeValue = Math.min(Math.max(value, 0), 100);

  const height = size === "sm" ? "h-1.5" : size === "lg" ? "h-3" : "h-2";

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-2 flex items-center justify-between gap-3">
          {label && (
            <span className="text-xs font-medium text-gray-600">{label}</span>
          )}

          {showValue && (
            <span className="text-xs font-semibold text-gray-700">
              {safeValue}%
            </span>
          )}
        </div>
      )}

      <div
        className={`w-full overflow-hidden rounded-full bg-gray-100 ${height}`}
      >
        <div
          className={`h-full rounded-full bg-primary transition-all duration-500 ${height}`}
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
