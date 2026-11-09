import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Copy,
  Link2,
  Loader2,
  Pencil,
  Plus,
  Power,
  Search,
  Ticket,
  Trash2,
  TrendingDown,
  Users,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import axiosClient from "../../api/axiosClient";
import { couponAdminApi } from "../../api/couponApi";

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

const toLocalInput = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const errorMessage = (err, fallback) =>
  err?.response?.data?.message || fallback;

// No look-alike characters (0/O, 1/I) so codes are easy to read out
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const generateCode = () => {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return `SAGE-${[...bytes].map((b) => ALPHABET[b % ALPHABET.length]).join("")}`;
};

const discountLabel = (coupon) =>
  coupon.discountType === "percentage"
    ? `${coupon.discountValue}% off`
    : `${money(coupon.discountValue)} off`;

const copyText = async (value, label) => {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied.`);
  } catch {
    toast.error("Couldn’t copy. Please copy it manually.");
  }
};

const STATUS_STYLES = {
  active: "bg-emerald-50 text-emerald-700",
  scheduled: "bg-blue-50 text-blue-700",
  expired: "bg-gray-100 text-gray-600",
  exhausted: "bg-amber-50 text-amber-700",
  inactive: "bg-red-50 text-red-700",
};

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "expired", label: "Expired" },
  { value: "exhausted", label: "Used up" },
  { value: "inactive", label: "Inactive" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

const EMPTY_FORM = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  maxDiscountNaira: "",
  minOrderNaira: "",
  appliesTo: "all",
  courses: [],
  startsAt: "",
  expiresAt: "",
  usageLimit: "",
  perUserLimit: "1",
  isActive: true,
};

const toForm = (coupon) => ({
  code: coupon.code,
  description: coupon.description || "",
  discountType: coupon.discountType,
  discountValue: String(coupon.discountValue),
  maxDiscountNaira: coupon.maxDiscountNaira
    ? String(coupon.maxDiscountNaira)
    : "",
  minOrderNaira: coupon.minOrderNaira ? String(coupon.minOrderNaira) : "",
  appliesTo: coupon.appliesTo,
  courses: coupon.courses || [],
  startsAt: toLocalInput(coupon.startsAt),
  expiresAt: toLocalInput(coupon.expiresAt),
  usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
  perUserLimit: String(coupon.perUserLimit || 1),
  isActive: coupon.isActive,
});

const toPayload = (form) => ({
  code: form.code.trim(),
  description: form.description.trim(),
  discountType: form.discountType,
  discountValue: Number(form.discountValue),
  maxDiscountNaira:
    form.discountType === "percentage" && form.maxDiscountNaira !== ""
      ? Number(form.maxDiscountNaira)
      : null,
  minOrderNaira: form.minOrderNaira === "" ? 0 : Number(form.minOrderNaira),
  appliesTo: form.appliesTo,
  courses: form.appliesTo === "courses" ? form.courses.map((c) => c.id) : [],
  startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
  expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
  usageLimit: form.usageLimit === "" ? null : Number(form.usageLimit),
  perUserLimit: form.perUserLimit === "" ? 1 : Number(form.perUserLimit),
  isActive: form.isActive,
});

// Shared modal shell: Escape closes, page behind doesn't scroll
function Modal({ title, onClose, children, wide = false }) {
  useEffect(() => {
    const onKey = (event) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-gray-950/60 p-0 sm:items-center sm:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${
          wide ? "max-w-3xl" : "max-w-2xl"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* create / edit form                                                  */
/* ------------------------------------------------------------------ */

function CouponFormModal({ coupon, onClose, onSaved }) {
  const editing = Boolean(coupon);
  const [form, setForm] = useState(() =>
    coupon ? toForm(coupon) : EMPTY_FORM,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [courseOptions, setCourseOptions] = useState(null); // null = not loaded
  const [courseSearch, setCourseSearch] = useState("");

  const set = (field) => (event) =>
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

  // Load the course list the first time "selected courses" is chosen
  useEffect(() => {
    if (form.appliesTo !== "courses" || courseOptions) return;
    let cancelled = false;

    axiosClient
      .get("/courses/public")
      .then(({ data }) => {
        if (!cancelled) {
          setCourseOptions(
            (data.courses || []).map((c) => ({
              id: String(c._id || c.id),
              title: c.title,
            })),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCourseOptions([]);
      });

    return () => {
      cancelled = true;
    };
  }, [form.appliesTo, courseOptions]);

  const selectedIds = useMemo(
    () => new Set(form.courses.map((c) => c.id)),
    [form.courses],
  );

  const toggleCourse = (course) =>
    setForm((prev) => ({
      ...prev,
      courses: selectedIds.has(course.id)
        ? prev.courses.filter((c) => c.id !== course.id)
        : [...prev.courses, course],
    }));

  const visibleCourses = (courseOptions || []).filter((c) =>
    c.title.toLowerCase().includes(courseSearch.trim().toLowerCase()),
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");
    try {
      const payload = toPayload(form);
      const { data } = editing
        ? await couponAdminApi.update(coupon.id, payload)
        : await couponAdminApi.create(payload);
      toast.success(editing ? "Coupon updated" : "Coupon created");
      onSaved(data.coupon);
    } catch (err) {
      setError(
        errorMessage(err, "Couldn’t save this coupon. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  const isPercent = form.discountType === "percentage";

  return (
    <Modal title={editing ? "Edit coupon" : "New coupon"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="grid flex-1 gap-5 overflow-y-auto px-5 py-5 sm:grid-cols-2 sm:px-6">
          <Field
            label="Coupon code"
            hint="Students type this at checkout. Letters, numbers, hyphens."
            className="sm:col-span-2"
          >
            <div className="flex gap-2">
              <input
                required
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code: e.target.value
                      .toUpperCase()
                      .replace(/[^A-Z0-9_-]/g, ""),
                  }))
                }
                maxLength={30}
                placeholder="e.g. WELCOME20"
                className={`${inputClass} font-mono uppercase`}
              />
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, code: generateCode() }))
                }
                className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-gray-200 px-3.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                <Wand2 size={15} /> Generate
              </button>
            </div>
          </Field>

          <Field
            label="Description (optional)"
            className="sm:col-span-2"
            hint="For your own reference, e.g. “Black Friday 2026”."
          >
            <input
              value={form.description}
              onChange={set("description")}
              maxLength={200}
              className={inputClass}
            />
          </Field>

          <Field label="Discount type">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
              {[
                ["percentage", "Percentage"],
                ["fixed", "Fixed amount"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, discountType: value }))
                  }
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                    form.discountType === value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={isPercent ? "Percentage off" : "Amount off (₦)"}>
            <div className="relative">
              <input
                required
                type="number"
                min="1"
                max={isPercent ? 100 : undefined}
                step="any"
                value={form.discountValue}
                onChange={set("discountValue")}
                placeholder={isPercent ? "20" : "5000"}
                className={`${inputClass} pr-9`}
              />
              <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {isPercent ? "%" : "₦"}
              </span>
            </div>
          </Field>

          {isPercent && (
            <Field
              label="Maximum discount (₦, optional)"
              hint="Caps a percentage coupon, e.g. 20% off but at most ₦10,000."
            >
              <input
                type="number"
                min="1"
                value={form.maxDiscountNaira}
                onChange={set("maxDiscountNaira")}
                className={inputClass}
              />
            </Field>
          )}

          <Field
            label="Minimum order (₦, optional)"
            hint="The eligible courses must add up to at least this."
          >
            <input
              type="number"
              min="0"
              value={form.minOrderNaira}
              onChange={set("minOrderNaira")}
              className={inputClass}
            />
          </Field>

          {/* Scope */}
          <div className="sm:col-span-2">
            <p className="mb-1.5 text-sm font-medium text-gray-700">
              Applies to
            </p>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-gray-100 p-1">
              {[
                ["all", "All courses"],
                ["courses", "Selected courses"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, appliesTo: value }))
                  }
                  className={`cursor-pointer rounded-lg px-3 py-2 text-sm font-medium transition ${
                    form.appliesTo === value
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {form.appliesTo === "courses" && (
              <div className="mt-3 rounded-xl border border-gray-200">
                <div className="border-b border-gray-100 p-2.5">
                  <input
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    placeholder="Search published courses"
                    aria-label="Search courses"
                    className={inputClass}
                  />
                </div>

                <div className="max-h-48 overflow-y-auto">
                  {courseOptions === null ? (
                    <p className="flex items-center gap-2 p-4 text-sm text-gray-500">
                      <Loader2 size={15} className="animate-spin" /> Loading
                      courses…
                    </p>
                  ) : visibleCourses.length === 0 ? (
                    <p className="p-4 text-sm text-gray-500">
                      No courses found.
                    </p>
                  ) : (
                    visibleCourses.map((course) => (
                      <label
                        key={course.id}
                        className="flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(course.id)}
                          onChange={() => toggleCourse(course)}
                          className="h-4 w-4 cursor-pointer rounded border-gray-300"
                        />
                        <span className="min-w-0 truncate">{course.title}</span>
                      </label>
                    ))
                  )}
                </div>

                <p className="border-t border-gray-100 px-3.5 py-2 text-xs text-gray-500">
                  {form.courses.length} selected
                </p>
              </div>
            )}
          </div>

          <Field
            label="Starts (optional)"
            hint="Leave empty to start immediately."
          >
            <input
              type="datetime-local"
              value={form.startsAt}
              onChange={set("startsAt")}
              className={inputClass}
            />
          </Field>

          <Field label="Expires (optional)" hint="Leave empty for no expiry.">
            <input
              type="datetime-local"
              value={form.expiresAt}
              onChange={set("expiresAt")}
              className={inputClass}
            />
          </Field>

          <Field
            label="Total uses (optional)"
            hint="Empty = unlimited. A pending bank transfer counts as a use."
          >
            <input
              type="number"
              min="1"
              step="1"
              value={form.usageLimit}
              onChange={set("usageLimit")}
              className={inputClass}
            />
          </Field>

          <Field
            label="Uses per student"
            hint="How many times one student can use it."
          >
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={form.perUserLimit}
              onChange={set("perUserLimit")}
              className={inputClass}
            />
          </Field>

          <label className="flex cursor-pointer items-center gap-3 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, isActive: e.target.checked }))
              }
              className="h-4 w-4 cursor-pointer rounded border-gray-300"
            />
            <span className="text-sm text-gray-700">
              Active (students can use it)
            </span>
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:col-span-2"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="cursor-pointer rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving && <Loader2 size={15} className="animate-spin" />}
            {saving ? "Saving…" : editing ? "Save changes" : "Create coupon"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* who used it                                                         */
/* ------------------------------------------------------------------ */

function RedemptionsModal({ coupon, onClose }) {
  const [state, setState] = useState({ loading: true, error: "", rows: [] });

  useEffect(() => {
    let cancelled = false;
    couponAdminApi
      .redemptions(coupon.id)
      .then(
        ({ data }) =>
          !cancelled &&
          setState({ loading: false, error: "", rows: data.redemptions }),
      )
      .catch(
        (err) =>
          !cancelled &&
          setState({
            loading: false,
            error: errorMessage(err, "Couldn’t load usage."),
            rows: [],
          }),
      );
    return () => {
      cancelled = true;
    };
  }, [coupon.id]);

  return (
    <Modal title={`Usage of ${coupon.code}`} onClose={onClose} wide>
      <div className="overflow-y-auto px-5 py-5 sm:px-6">
        {state.loading ? (
          <p className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </p>
        ) : state.error ? (
          <p role="alert" className="py-6 text-center text-sm text-red-600">
            {state.error}
          </p>
        ) : state.rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-gray-500">
            This coupon hasn’t been used yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {state.rows.map((row) => (
              <li key={row.reference} className="py-3.5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.name}
                    </p>
                    <p className="break-all text-xs text-gray-500">
                      {row.email}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      row.status === "pending"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-emerald-50 text-emerald-700"
                    }`}
                  >
                    {row.status === "paid"
                      ? "Paid"
                      : row.status === "approved"
                        ? "Approved"
                        : "Pending approval"}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-gray-600">
                  {row.courses.join(", ")}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {row.via} · saved {money(row.discount)} · paid{" "}
                  {money(row.amount)} · {formatDateTime(row.date)} ·{" "}
                  {row.reference}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

function Stat({ icon: Icon, label, value, tone }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

export default function AdminCoupons() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const [formFor, setFormFor] = useState(null); // null | "new" | coupon
  const [usageFor, setUsageFor] = useState(null);

  const [state, setState] = useState({
    loading: true,
    error: "",
    coupons: [],
    pagination: { page: 1, totalPages: 1, total: 0 },
    stats: { total: 0, active: 0, redemptions: 0, discountGiven: 0 },
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(search.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const { data } = await couponAdminApi.list({
        page,
        limit: 10,
        status: tab,
        search: debounced || undefined,
      });
      setState({
        loading: false,
        error: "",
        coupons: data.coupons,
        pagination: data.pagination,
        stats: data.stats,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage(err, "Couldn’t load coupons."),
      }));
    }
  }, [page, tab, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (coupon) => {
    setBusyId(coupon.id);
    try {
      await couponAdminApi.setStatus(coupon.id, !coupon.isActive);
      toast.success(
        coupon.isActive ? "Coupon deactivated" : "Coupon activated",
      );
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t update this coupon."));
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (coupon) => {
    if (!window.confirm(`Delete coupon ${coupon.code}?`)) return;
    setBusyId(coupon.id);
    try {
      const { data } = await couponAdminApi.remove(coupon.id);
      toast.success(data.message);
      if (state.coupons.length === 1 && page > 1) setPage(page - 1);
      else load();
    } catch (err) {
      toast.error(errorMessage(err, "Couldn’t delete this coupon."));
    } finally {
      setBusyId(null);
    }
  };

  const { loading, error, coupons, pagination, stats } = state;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create discount codes that students apply in their cart.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFormFor("new")}
          className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
        >
          <Plus size={17} /> New coupon
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Ticket}
          label="Total coupons"
          value={stats.total}
          tone="bg-red-50 text-primary"
        />
        <Stat
          icon={Power}
          label="Active now"
          value={stats.active}
          tone="bg-emerald-50 text-emerald-600"
        />
        <Stat
          icon={Users}
          label="Redemptions"
          value={stats.redemptions}
          tone="bg-blue-50 text-secondary"
        />
        <Stat
          icon={TrendingDown}
          label="Discount given"
          value={money(stats.discountGiven)}
          tone="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-1 overflow-x-auto rounded-xl bg-gray-50 p-1">
            {TABS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setTab(item.value);
                  setPage(1);
                }}
                className={`shrink-0 cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium transition ${
                  tab === item.value
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:max-w-xs">
            <Search
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search code or description"
              aria-label="Search coupons"
              className="w-full rounded-xl border border-gray-200 py-2.5 pl-10 pr-4 text-sm focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
            />
          </div>
        </div>

        {error ? (
          <div role="alert" className="p-8 text-center text-sm text-red-600">
            {error}{" "}
            <button
              type="button"
              onClick={load}
              className="cursor-pointer font-semibold underline"
            >
              Try again
            </button>
          </div>
        ) : loading && coupons.length === 0 ? (
          <p className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" /> Loading coupons…
          </p>
        ) : coupons.length === 0 ? (
          <p className="p-10 text-center text-sm text-gray-500">
            {debounced || tab !== "all"
              ? "No coupons match your filters."
              : "No coupons yet. Click “New coupon” to create your first one."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {coupons.map((coupon) => (
              <li key={coupon.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-base font-bold tracking-wide text-gray-900">
                        {coupon.code}
                      </span>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[coupon.status]}`}
                      >
                        {coupon.status === "exhausted"
                          ? "Used up"
                          : coupon.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyText(coupon.code, "Code")}
                        aria-label={`Copy code ${coupon.code}`}
                        title="Copy code"
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          copyText(
                            `${window.location.origin}/cart?coupon=${coupon.code}`,
                            "Coupon link",
                          )
                        }
                        aria-label={`Copy link for ${coupon.code}`}
                        title="Copy a link that applies this coupon automatically"
                        className="cursor-pointer rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      >
                        <Link2 size={15} />
                      </button>
                    </div>

                    {coupon.description && (
                      <p className="mt-1 text-sm text-gray-600">
                        {coupon.description}
                      </p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-primary">
                        {discountLabel(coupon)}
                        {coupon.maxDiscountNaira
                          ? ` (up to ${money(coupon.maxDiscountNaira)})`
                          : ""}
                      </span>
                      <span
                        className="rounded-full bg-gray-100 px-2.5 py-1"
                        title={coupon.courses.map((c) => c.title).join(", ")}
                      >
                        {coupon.appliesTo === "all"
                          ? "All courses"
                          : `${coupon.courses.length} ${coupon.courses.length === 1 ? "course" : "courses"}`}
                      </span>
                      {coupon.minOrderNaira > 0 && (
                        <span className="rounded-full bg-gray-100 px-2.5 py-1">
                          Min. order {money(coupon.minOrderNaira)}
                        </span>
                      )}
                      <span className="rounded-full bg-gray-100 px-2.5 py-1">
                        {coupon.redeemed}
                        {coupon.usageLimit
                          ? ` / ${coupon.usageLimit}`
                          : ""}{" "}
                        used
                        {coupon.pending > 0
                          ? ` (+${coupon.pending} pending)`
                          : ""}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1">
                        {coupon.perUserLimit} per student
                      </span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-1">
                        {coupon.startsAt || coupon.expiresAt
                          ? [
                              coupon.startsAt &&
                                `From ${formatDate(coupon.startsAt)}`,
                              coupon.expiresAt &&
                                `Until ${formatDate(coupon.expiresAt)}`,
                            ]
                              .filter(Boolean)
                              .join(" · ")
                          : "No expiry"}
                      </span>
                      {coupon.discountGiven > 0 && (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                          {money(coupon.discountGiven)} discounted
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setUsageFor(coupon)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Users size={13} /> Usage
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormFor(coupon)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      type="button"
                      disabled={busyId === coupon.id}
                      onClick={() => toggleActive(coupon)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    >
                      <Power size={13} />{" "}
                      {coupon.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      type="button"
                      disabled={busyId === coupon.id}
                      onClick={() => handleDelete(coupon)}
                      className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-sm text-gray-600">
            <span>
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= pagination.totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="cursor-pointer rounded-lg border border-gray-200 px-3 py-1.5 font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {formFor && (
        <CouponFormModal
          coupon={formFor === "new" ? null : formFor}
          onClose={() => setFormFor(null)}
          onSaved={() => {
            setFormFor(null);
            load();
          }}
        />
      )}

      {usageFor && (
        <RedemptionsModal coupon={usageFor} onClose={() => setUsageFor(null)} />
      )}
    </div>
  );
}
