import { Loader2 } from "lucide-react";

export function PrimaryButton({ children, loading, className = "", ...props }) {
  return (
    <button
      className={`w-full max-w-[350px] h-12 rounded-control border border-primary bg-primary text-white text-base font-medium flex items-center justify-center gap-2 transition-colors hover:bg-primary-hover active:bg-primary-pressed disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : children}
    </button>
  );
}

export function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`w-full max-w-[350px] h-12 rounded-control border border-secondary text-secondary bg-transparent text-base font-medium flex items-center justify-center transition-colors hover:bg-secondary/5 active:bg-secondary/10 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TextButton({ children, className = "", ...props }) {
  return (
    <button
      type="button"
      className={`text-sm font-semibold text-secondary bg-transparent border-none p-0 hover:underline ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
