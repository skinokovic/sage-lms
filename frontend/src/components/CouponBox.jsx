import { useState } from "react";
import { Loader2, Tag, X } from "lucide-react";
import { toast } from "react-toastify";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const describe = (coupon) =>
  coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off`
    : `${money(coupon.discountValue)} off`;

/**
 * Coupon entry used on the Cart and Checkout pages.
 * `coupon` is the object returned by useCoupon(items).
 */
export default function CouponBox({ coupon }) {
  const [input, setInput] = useState("");
  const { quote, error, loading, apply, remove } = coupon;

  const submit = async () => {
    const ok = await apply(input);
    if (ok) {
      setInput("");
      toast.success("Coupon applied.");
    }
  };

  // A coupon is applied: show it with a way to take it off
  if (quote) {
    return (
      <div>
        <p className="text-xs font-bold text-heading">Coupon</p>

        <div className="mt-2 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Tag size={15} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="break-all text-sm font-bold text-emerald-900">
              {quote.coupon.code}
            </p>
            <p className="text-xs text-emerald-800">
              {describe(quote.coupon)} · you save {money(quote.discount)}
            </p>
          </div>

          <button
            type="button"
            onClick={remove}
            aria-label={`Remove coupon ${quote.coupon.code}`}
            className="cursor-pointer rounded-lg p-1.5 text-emerald-800 transition hover:bg-emerald-100"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <p role="alert" className="mt-2 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor="coupon-code"
        className="block text-xs font-bold text-heading"
      >
        Coupon code
      </label>

      <div className="mt-2 flex gap-2">
        <input
          id="coupon-code"
          value={input}
          onChange={(event) => setInput(event.target.value.toUpperCase())}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              submit();
            }
          }}
          placeholder="Enter code"
          maxLength={30}
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-xl border border-line px-3 py-2.5 text-sm uppercase outline-none placeholder:normal-case focus:border-primary focus:ring-2 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={submit}
          disabled={loading || !input.trim()}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line px-4 text-sm font-bold text-heading transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading && <Loader2 size={14} className="animate-spin" />}
          Apply
        </button>
      </div>

      {error && (
        <p role="alert" className="mt-2 text-xs leading-5 text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
