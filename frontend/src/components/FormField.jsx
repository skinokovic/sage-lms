export default function FormField({
  id,
  label,
  type = "text",
  icon: Icon,
  error,
  ...inputProps
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-heading">
        {label}
      </label>
      <div
        className={`flex items-center gap-2 h-[46px] px-3 rounded-control border bg-surface transition-colors ${
          error ? "border-primary" : "border-line focus-within:border-secondary"
        }`}
      >
        {Icon && <Icon size={18} className="shrink-0 text-icon" />}
        <input
          id={id}
          type={type}
          className="flex-1 min-w-0 bg-transparent outline-none text-base text-heading placeholder:text-gray-400"
          {...inputProps}
        />
      </div>
      {error && <span className="text-xs text-primary">{error}</span>}
    </div>
  );
}
