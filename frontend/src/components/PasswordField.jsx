import { useState } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";

export default function PasswordField({ id, label, error, ...inputProps }) {
  const [visible, setVisible] = useState(false);

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
        <Lock size={18} className="shrink-0 text-icon" />
        <input
          id={id}
          type={visible ? "text" : "password"}
          className="flex-1 min-w-0 bg-transparent outline-none text-base text-heading placeholder:text-gray-400"
          {...inputProps}
        />
        <button
          type="button"
          className="p-1 text-body hover:text-heading transition-colors"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <span className="text-xs text-primary">{error}</span>}
    </div>
  );
}
