import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import { instructorApplicationApi } from "../../api/instructorApplicationApi";

const statusStyles = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  under_review: "bg-blue-50 text-blue-700 border-blue-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

const statusLabels = {
  pending: "Pending",
  under_review: "Under review",
  approved: "Approved",
  rejected: "Rejected",
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

export default function InstructorApplications() {
  const [applications, setApplications] = useState([]);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");

  const loadApplications = async () => {
    try {
      setLoading(true);
      const { data } = await instructorApplicationApi.list({
        search: search || undefined,
        status: status === "all" ? undefined : status,
      });
      setApplications(data.applications || []);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load instructor applications.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [status]);

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return applications;

    return applications.filter((application) =>
      [
        application.user?.name,
        application.user?.email,
        application.expertise,
        application.courseCategory,
        application.professionalTitle,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [applications, search]);

  const stats = useMemo(
    () => ({
      total: applications.length,
      pending: applications.filter((item) => item.status === "pending").length,
      reviewing: applications.filter((item) => item.status === "under_review")
        .length,
      approved: applications.filter((item) => item.status === "approved")
        .length,
    }),
    [applications],
  );

  const openApplication = async (id) => {
    try {
      const { data } = await instructorApplicationApi.getById(id);
      setSelected(data.application);
      setAdminNotes(data.application.adminNotes || "");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to open application.",
      );
    }
  };

  const markReviewing = async () => {
    if (!selected) return;
    try {
      setActionLoading(true);
      const { data } = await instructorApplicationApi.markReviewing(
        selected._id,
      );
      setSelected(data.application);
      setAdminNotes(data.application.adminNotes || "");
      await loadApplications();
      toast.success("Application marked as under review.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const approve = async () => {
    if (!selected) return;
    if (!window.confirm("Approve this instructor application?")) return;

    try {
      setActionLoading(true);
      const { data } = await instructorApplicationApi.approve(
        selected._id,
        adminNotes,
      );
      setSelected(data.application);
      await loadApplications();
      toast.success("Application approved. The user is now an instructor.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to approve application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!selected) return;
    if (!adminNotes.trim()) {
      toast.error("Add a short reason before rejecting the application.");
      return;
    }

    if (!window.confirm("Reject this instructor application?")) return;

    try {
      setActionLoading(true);
      const { data } = await instructorApplicationApi.reject(
        selected._id,
        adminNotes.trim(),
      );
      setSelected(data.application);
      await loadApplications();
      toast.success("Application rejected.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to reject application.",
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
            Instructor management
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-heading sm:text-3xl">
            Instructor Applications
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-body">
            Review applications, assess professional information and control who
            receives instructor access.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white">
          <ShieldCheck size={18} /> Admin review
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Users} label="Total applications" value={stats.total} />
        <Stat icon={Clock3} label="Pending" value={stats.pending} />
        <Stat icon={Eye} label="Under review" value={stats.reviewing} />
        <Stat icon={UserCheck} label="Approved" value={stats.approved} />
      </div>

      <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-body"
            />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadApplications();
              }}
              placeholder="Search applicant, expertise, category..."
              className="h-11 w-full rounded-xl border border-line bg-surface pl-10 pr-4 text-sm text-heading outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="h-11 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-heading outline-none focus:border-primary"
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="under_review">Under review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            type="button"
            onClick={loadApplications}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-line px-4 text-sm font-bold text-heading transition hover:border-primary hover:text-primary"
          >
            <Filter size={17} /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="h-20 animate-pulse rounded-2xl bg-surface-muted"
            />
          ))}
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line bg-surface p-10 text-center">
          <AlertCircle className="mx-auto text-body" size={30} />
          <h2 className="mt-4 font-extrabold text-heading">
            No applications found
          </h2>
          <p className="mt-1 text-sm text-body">
            Try another search or status filter.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
          <div className="hidden overflow-x-auto lg:block">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-line bg-surface-muted text-xs uppercase tracking-wider text-body">
                <tr>
                  <th className="px-5 py-4 font-bold">Applicant</th>
                  <th className="px-5 py-4 font-bold">Expertise</th>
                  <th className="px-5 py-4 font-bold">Category</th>
                  <th className="px-5 py-4 font-bold">Experience</th>
                  <th className="px-5 py-4 font-bold">Status</th>
                  <th className="px-5 py-4 text-right font-bold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredApplications.map((application) => (
                  <tr
                    key={application._id}
                    className="transition hover:bg-surface-muted/60"
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-heading">
                        {application.user?.name || "Unknown user"}
                      </p>
                      <p className="mt-1 text-xs text-body">
                        {application.user?.email}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-sm text-heading">
                      {application.expertise}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {application.courseCategory}
                    </td>
                    <td className="px-5 py-4 text-sm text-body">
                      {application.yearsOfExperience} yrs
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => openApplication(application._id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-bold text-heading transition hover:border-primary hover:text-primary"
                      >
                        <Eye size={15} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="divide-y divide-line lg:hidden">
            {filteredApplications.map((application) => (
              <div key={application._id} className="p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-heading">
                      {application.user?.name || "Unknown user"}
                    </p>
                    <p className="mt-1 truncate text-xs text-body">
                      {application.user?.email}
                    </p>
                  </div>
                  <StatusBadge status={application.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                  <Info label="Expertise" value={application.expertise} />
                  <Info label="Category" value={application.courseCategory} />
                  <Info
                    label="Experience"
                    value={`${application.yearsOfExperience} yrs`}
                  />
                  <Info
                    label="Submitted"
                    value={formatDate(application.createdAt)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => openApplication(application._id)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-line px-4 py-3 text-sm font-bold text-heading hover:border-primary hover:text-primary"
                >
                  <Eye size={17} /> Review application
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  Application review
                </p>
                <h2 className="mt-1 text-lg font-extrabold text-heading">
                  {selected.user?.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-xl p-2 text-body hover:bg-surface-muted hover:text-heading"
                aria-label="Close"
              >
                <X size={21} />
              </button>
            </div>

            <div className="overflow-y-auto p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={selected.status} />
                <span className="text-xs text-body">
                  Submitted {formatDate(selected.createdAt)}
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Detail label="Email" value={selected.user?.email} />
                <Detail
                  label="Professional title"
                  value={selected.professionalTitle}
                />
                <Detail label="Expertise" value={selected.expertise} />
                <Detail
                  label="Years of experience"
                  value={`${selected.yearsOfExperience} years`}
                />
                <Detail
                  label="Organization"
                  value={selected.organization || "Not provided"}
                />
                <Detail
                  label="Course category"
                  value={selected.courseCategory}
                />
                <Detail
                  label="LinkedIn"
                  value={selected.linkedinUrl || "Not provided"}
                />
                <Detail
                  label="Website"
                  value={selected.websiteUrl || "Not provided"}
                />
              </div>

              <div className="mt-6 space-y-5">
                <TextBlock
                  label="Teaching / training experience"
                  value={selected.teachingExperience}
                />
                <TextBlock
                  label="Why they want to teach"
                  value={selected.motivation}
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-heading">
                  Admin notes / feedback
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(event) => setAdminNotes(event.target.value)}
                  rows={4}
                  placeholder="Add feedback or internal notes..."
                  className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="border-t border-line bg-surface-muted p-4 sm:p-5">
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={actionLoading || selected.status === "approved"}
                  onClick={reject}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircle size={17} /> Reject
                </button>

                {selected.status === "pending" && (
                  <button
                    type="button"
                    disabled={actionLoading}
                    onClick={markReviewing}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 px-4 py-3 text-sm font-bold text-blue-700 disabled:opacity-50"
                  >
                    <Eye size={17} /> Mark under review
                  </button>
                )}

                <button
                  type="button"
                  disabled={actionLoading || selected.status === "approved"}
                  onClick={approve}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <CheckCircle2 size={17} />
                  {actionLoading ? "Saving..." : "Approve & make instructor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-secondary">
          <Icon size={20} />
        </div>
        <p className="text-2xl font-extrabold text-heading">{value}</p>
      </div>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-body">
        {label}
      </p>
    </div>
  );
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusStyles[status] || statusStyles.pending}`}
    >
      {statusLabels[status] || status}
    </span>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-surface-muted p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-body">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 font-semibold text-heading">
        {value || "—"}
      </p>
    </div>
  );
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-body">
        {label}
      </p>
      <p className="mt-1 break-words text-sm font-semibold text-heading">
        {value || "—"}
      </p>
    </div>
  );
}

function TextBlock({ label, value }) {
  return (
    <div>
      <p className="text-sm font-bold text-heading">{label}</p>
      <p className="mt-2 rounded-xl bg-surface-muted p-4 text-sm leading-6 text-body">
        {value || "—"}
      </p>
    </div>
  );
}
