import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  Search,
  XCircle,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { adminBankTransferApi } from "../../api/adminBankTransferApi";

const PAGE_SIZE = 10;

const TABS = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "All", label: "All" },
];

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "—";

const STATUS_STYLES = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-700",
  approved: "border-green-200 bg-green-50 text-green-700",
  rejected: "border-red-200 bg-red-50 text-red-700",
};

const BankTransfers = () => {
  const [requests, setRequests] = useState([]);
  const [counts, setCounts] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState("pending");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  const [reviewing, setReviewing] = useState(null); // { request, mode }

  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadRequests = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");

    try {
      const { data } = await adminBankTransferApi.list({
        page,
        limit: PAGE_SIZE,
        status: tab !== "All" ? tab : undefined,
        search: debouncedSearch || undefined,
      });

      if (currentRequest !== requestId.current) return;

      setRequests(data.requests || []);
      setCounts(data.counts || { pending: 0, approved: 0, rejected: 0 });
      setPagination(
        data.pagination || {
          page: 1,
          limit: PAGE_SIZE,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (err) {
      if (currentRequest !== requestId.current) return;
      setError(
        err.response?.data?.message ||
          "Couldn't load the bank transfer requests.",
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [page, tab, debouncedSearch]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const changeTab = (value) => {
    setTab(value);
    setPage(1);
  };

  const total = counts.pending + counts.approved + counts.rejected;
  const isFirstLoad = loading && requests.length === 0 && !error;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <section>
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Bank Transfers
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Students who paid by bank transfer appear here. Check the money in the
          school's bank account, then approve the request to enroll them.
        </p>
      </section>

      {/* Tabs + search */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((item) => {
              const count =
                item.value === "All" ? total : counts[item.value] || 0;
              const active = tab === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => changeTab(item.value)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    active
                      ? "bg-[#1E3A8A] text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {item.label}
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                      active
                        ? "bg-white/20 text-white"
                        : item.value === "pending" && count > 0
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative lg:w-96">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by student, reference or sender…"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            />
          </div>
        </div>
      </section>

      {/* List */}
      <section className="space-y-4">
        {isFirstLoad && (
          <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-16 text-sm text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Loading requests…
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <h3 className="font-semibold text-gray-900">
              Couldn't load the requests
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={loadRequests}
              className="mt-4 rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000]"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && requests.length === 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Banknote size={26} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">
              {tab === "pending" && !debouncedSearch
                ? "Nothing waiting for confirmation"
                : "No requests found"}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {tab === "pending" && !debouncedSearch
                ? "New bank transfers from students will show up here."
                : "Try a different tab or search."}
            </p>
          </div>
        )}

        {requests.length > 0 && !error && (
          <div
            className={`space-y-4 ${loading ? "opacity-60 transition-opacity" : ""}`}
          >
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={() => setReviewing({ request, mode: "approve" })}
                onReject={() => setReviewing({ request, mode: "reject" })}
              />
            ))}
          </div>
        )}

        {pagination.total > 0 && !error && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-700">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {pagination.totalPages}
              </span>{" "}
              · {pagination.total} request{pagination.total === 1 ? "" : "s"}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                disabled={pagination.page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(current + 1, pagination.totalPages),
                  )
                }
                disabled={pagination.page >= pagination.totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {reviewing && (
        <ReviewModal
          request={reviewing.request}
          mode={reviewing.mode}
          onClose={() => setReviewing(null)}
          onDone={() => {
            setReviewing(null);
            loadRequests();
          }}
        />
      )}
    </div>
  );
};

/* ============================================================
   REQUEST CARD
============================================================ */

const RequestCard = ({ request, onApprove, onReject }) => (
  <article className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/70 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm font-bold text-gray-900">
          {request.reference}
        </span>
        <span
          className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[request.status]}`}
        >
          {request.status}
        </span>
      </div>

      <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
        <Clock3 size={14} />
        Submitted {formatDateTime(request.submittedAt)}
      </span>
    </div>

    <div className="grid gap-6 p-5 lg:grid-cols-3">
      {/* Student + courses */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Student
        </p>
        <p className="mt-2 font-semibold text-gray-900">
          {request.student.name}
        </p>
        <p className="text-sm text-gray-500">{request.student.email}</p>
        <p className="text-sm text-gray-500">{request.student.phone}</p>

        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-gray-400">
          Courses
        </p>
        <ul className="mt-2 space-y-1.5">
          {request.courses.map((course) => (
            <li
              key={course.courseId}
              className="flex justify-between gap-3 text-sm"
            >
              <span className="min-w-0 text-gray-700">{course.title}</span>
              <span className="shrink-0 font-semibold text-gray-900">
                {money(course.price)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Transfer details */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Transfer details
        </p>

        <dl className="mt-2 space-y-2 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Amount to confirm</dt>
            <dd className="text-base font-extrabold text-[#B00000]">
              {money(request.amount)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Sent from</dt>
            <dd className="text-right font-semibold text-gray-900">
              {request.senderName}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Transfer date</dt>
            <dd className="font-semibold text-gray-900">
              {formatDate(request.transferDate)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">Bank reference</dt>
            <dd className="text-right font-semibold text-gray-900">
              {request.transferReference || "—"}
            </dd>
          </div>
        </dl>

        {request.note && (
          <p className="mt-3 rounded-xl bg-gray-50 p-3 text-xs leading-5 text-gray-600">
            <span className="font-semibold">Student note:</span> {request.note}
          </p>
        )}
      </div>

      {/* Action / outcome */}
      <div className="flex flex-col justify-between gap-4">
        {request.status === "pending" ? (
          <div className="space-y-3">
            <button
              type="button"
              onClick={onApprove}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              <CheckCircle2 size={17} />
              Approve &amp; enroll
            </button>

            <button
              type="button"
              onClick={onReject}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              <XCircle size={17} />
              Reject
            </button>
          </div>
        ) : (
          <div className="rounded-xl bg-gray-50 p-4 text-xs leading-5 text-gray-600">
            <p className="font-semibold text-gray-800">
              {request.status === "approved" ? "Approved" : "Rejected"}
              {request.reviewedBy && ` by ${request.reviewedBy}`}
            </p>
            <p>{formatDateTime(request.reviewedAt)}</p>

            {request.status === "rejected" && request.rejectionReason && (
              <p className="mt-2">
                <span className="font-semibold">Reason:</span>{" "}
                {request.rejectionReason}
              </p>
            )}

            {request.status === "approved" && request.adminNote && (
              <p className="mt-2">
                <span className="font-semibold">Note:</span> {request.adminNote}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  </article>
);

/* ============================================================
   REVIEW MODAL (approve / reject)
============================================================ */

const ReviewModal = ({ request, mode, onClose, onDone }) => {
  const isApprove = mode === "approve";

  const [text, setText] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (isApprove && !confirmed) {
      toast.error("Confirm that you have received the payment first.");
      return;
    }

    if (!isApprove && text.trim().length < 3) {
      toast.error("Give the student a reason for rejecting this request.");
      return;
    }

    setSubmitting(true);

    try {
      if (isApprove) {
        const { data } = await adminBankTransferApi.approve(request.id, {
          adminNote: text.trim(),
        });

        const problems = (data.results || []).filter(
          (result) => result.outcome === "skipped",
        );

        toast.success(`${request.student.name} has been enrolled.`);

        problems.forEach((result) =>
          toast.warning(`${result.title}: ${result.message}`),
        );
      } else {
        await adminBankTransferApi.reject(request.id, { reason: text.trim() });
        toast.success("Request rejected.");
      }

      onDone();
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Couldn't update this request. Please try again.",
      );

      // Someone else may have already reviewed it: refresh the list.
      if (error.response?.status === 409) onDone();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/50"
      />

      <form
        onSubmit={handleSubmit}
        className="relative flex max-h-[95vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            {isApprove ? "Approve and enroll" : "Reject request"}
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto p-5">
          <div className="rounded-xl bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-900">
              {request.student.name}
            </p>
            <p className="text-xs text-gray-500">{request.student.email}</p>
            <p className="mt-3 text-gray-700">
              {request.courses.map((course) => course.title).join(", ")}
            </p>
            <p className="mt-2 font-bold text-[#B00000]">
              {money(request.amount)} from {request.senderName}
            </p>
          </div>

          {isApprove ? (
            <>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(event) => setConfirmed(event.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-600"
                />
                <span className="text-sm text-gray-700">
                  I have checked the school's bank account and received{" "}
                  <strong>{money(request.amount)}</strong> for this request.
                </span>
              </label>

              <div>
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Note{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <textarea
                  rows={2}
                  value={text}
                  maxLength={500}
                  onChange={(event) => setText(event.target.value)}
                  placeholder="For your own records"
                  className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                />
              </div>

              <p className="flex items-start gap-2 text-xs text-gray-500">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                Approving enrolls the student in every course on this request.
              </p>
            </>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={text}
                maxLength={300}
                onChange={(event) => setText(event.target.value)}
                placeholder="e.g. We did not receive this payment. The amount was less than the course price."
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#1E3A8A]"
                autoFocus
              />
              <p className="mt-2 text-xs text-gray-500">
                The student will see this reason.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting}
            className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60 ${
              isApprove
                ? "bg-green-600 hover:bg-green-700"
                : "bg-red-600 hover:bg-red-700"
            }`}
          >
            {submitting ? (
              <Loader2 size={17} className="animate-spin" />
            ) : isApprove ? (
              <CheckCircle2 size={17} />
            ) : (
              <XCircle size={17} />
            )}
            {submitting
              ? "Saving…"
              : isApprove
                ? "Approve & enroll"
                : "Reject request"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BankTransfers;
