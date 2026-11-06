import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileCheck2,
  FileText,
  Lock,
  Search,
  Send,
  X,
} from "lucide-react";
import { fetchMyAssignments } from "../../store/studentAssignmentSlice";
import { formatDueDate, formatDueTime } from "../../utils/assignmentHelpers";

const filters = ["All", "Pending", "Submitted", "Graded"];

const getPercent = (item) =>
  item.totalMarks > 0 ? ((item.score ?? 0) / item.totalMarks) * 100 : 0;

const Assignments = () => {
  const dispatch = useDispatch();
  const {
    items: assignments,
    listStatus,
    listError,
  } = useSelector((state) => state.studentAssignments);

  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    dispatch(fetchMyAssignments());
  }, [dispatch]);

  const isLoading = listStatus === "idle" || listStatus === "loading";
  const hasFailed = listStatus === "failed";

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        assignment.title.toLowerCase().includes(searchText) ||
        assignment.course.toLowerCase().includes(searchText) ||
        assignment.type.toLowerCase().includes(searchText);

      const matchesFilter =
        activeFilter === "All" || assignment.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [assignments, activeFilter, search]);

  const pendingCount = assignments.filter(
    (item) => item.status === "Pending",
  ).length;

  const submittedCount = assignments.filter(
    (item) => item.status === "Submitted",
  ).length;

  const gradedAssignments = assignments.filter(
    (item) => item.status === "Graded",
  );
  const gradedCount = gradedAssignments.length;

  const averageScore =
    gradedCount > 0
      ? Math.round(
          gradedAssignments.reduce(
            (total, item) => total + getPercent(item),
            0,
          ) / gradedCount,
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B00000]">Academic Work</p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Assignments
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Keep track of your assignments, submissions and grades.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <FileText size={18} className="text-[#1E3A8A]" />

          <span>
            <strong className="text-gray-900">{assignments.length}</strong>{" "}
            total assignments
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={FileText}
          title="Total"
          value={assignments.length}
          description="All assignments"
          iconClass="bg-blue-50 text-[#1E3A8A]"
        />

        <SummaryCard
          icon={AlertCircle}
          title="Pending"
          value={pendingCount}
          description="Need your attention"
          iconClass="bg-red-50 text-[#B00000]"
        />

        <SummaryCard
          icon={Send}
          title="Submitted"
          value={submittedCount}
          description="Awaiting review"
          iconClass="bg-amber-50 text-amber-600"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Average Score"
          value={`${averageScore}%`}
          description={`${gradedCount} graded assignments`}
          iconClass="bg-green-50 text-green-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assignments..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Assignments */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex-1 space-y-3">
                  <div className="h-4 w-1/3 rounded bg-gray-100" />
                  <div className="h-6 w-2/3 rounded bg-gray-100" />
                  <div className="h-4 w-full rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
                <div className="h-28 w-full rounded-xl bg-gray-100 xl:w-52" />
              </div>
            </div>
          ))}
        </div>
      ) : hasFailed ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <FileText size={30} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Couldn't load your assignments
          </h3>

          <p className="mt-2 text-sm text-gray-500">{listError}</p>

          <button
            type="button"
            onClick={() => dispatch(fetchMyAssignments())}
            className="mt-5 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      ) : filteredAssignments.length > 0 ? (
        <div className="space-y-4">
          {filteredAssignments.map((assignment) => (
            <AssignmentCard key={assignment.id} assignment={assignment} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <FileText size={30} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No assignments found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {assignments.length === 0
              ? "No assignments have been published for your courses yet."
              : "Try changing your search or selected filter."}
          </p>

          {assignments.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
              className="mt-5 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Summary Card
|--------------------------------------------------------------------------
*/

const SummaryCard = ({ icon: Icon, title, value, description, iconClass }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Assignment Card
|--------------------------------------------------------------------------
*/

const AssignmentCard = ({ assignment }) => {
  const navigate = useNavigate();

  const statusConfig = {
    Pending: {
      icon: AlertCircle,
      className: "bg-red-50 text-[#B00000]",
    },

    Submitted: {
      icon: Send,
      className: "bg-amber-50 text-amber-700",
    },

    Graded: {
      icon: CheckCircle2,
      className: "bg-green-50 text-green-700",
    },
  };

  const config = statusConfig[assignment.status];
  const StatusIcon = config.icon;

  const dueTime = formatDueTime(assignment.dueDate);
  const scorePercent =
    assignment.totalMarks > 0
      ? Math.round(((assignment.score ?? 0) / assignment.totalMarks) * 100)
      : 0;

  // Relative path resolves to /…/assignments/:id from the Assignments route
  const openAssignment = () => navigate(assignment.id);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        {/* Main Information */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
              {assignment.course}
            </span>

            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {assignment.type}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
            >
              <StatusIcon size={13} />
              {assignment.status}
            </span>

            {assignment.isReturned && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Returned
              </span>
            )}

            {assignment.isOverdue && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#B00000]">
                Overdue
              </span>
            )}

            {assignment.isLate && (
              <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                Late
              </span>
            )}
          </div>

          <h2 className="mt-3 text-lg font-bold text-gray-900 sm:text-xl">
            {assignment.title}
          </h2>

          <p className="mt-2 line-clamp-2 max-w-3xl text-sm leading-6 text-gray-500">
            {assignment.description || "No description provided."}
          </p>

          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-[#1E3A8A]" />

              <span>
                Due:{" "}
                <strong className="text-gray-700">
                  {formatDueDate(assignment.dueDate)}
                </strong>
              </span>
            </div>

            {dueTime && (
              <div className="flex items-center gap-2">
                <Clock3 size={15} className="text-[#1E3A8A]" />

                <span>{dueTime}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <FileCheck2 size={15} className="text-[#1E3A8A]" />

              <span>{assignment.totalMarks} marks</span>
            </div>
          </div>

          <p className="mt-3 text-xs text-gray-400">
            Instructor:{" "}
            <span className="font-medium text-gray-600">
              {assignment.instructor}
            </span>
          </p>
        </div>

        {/* Right Side */}
        <div className="flex flex-col gap-3 border-t border-gray-100 pt-4 xl:w-52 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
          {assignment.status === "Graded" ? (
            <div className="rounded-xl bg-green-50 p-4 text-center">
              <p className="text-xs font-medium text-green-700">Your Score</p>

              <p className="mt-1 text-3xl font-bold text-green-700">
                {assignment.score ?? 0}
                <span className="text-lg">/{assignment.totalMarks}</span>
              </p>

              <p className="mt-1 text-xs text-green-600">{scorePercent}%</p>
            </div>
          ) : assignment.status === "Submitted" ? (
            <div className="rounded-xl bg-amber-50 p-4 text-center">
              <Send size={22} className="mx-auto text-amber-600" />

              <p className="mt-2 text-sm font-semibold text-amber-800">
                Submitted
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Awaiting instructor review
              </p>
            </div>
          ) : !assignment.canSubmit ? (
            <div className="rounded-xl bg-gray-100 p-4 text-center">
              <Lock size={22} className="mx-auto text-gray-500" />

              <p className="mt-2 text-sm font-semibold text-gray-700">
                Submissions Closed
              </p>

              <p className="mt-1 text-xs text-gray-500">
                You can still view the details
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-red-50 p-4 text-center">
              <AlertCircle size={22} className="mx-auto text-[#B00000]" />

              <p className="mt-2 text-sm font-semibold text-[#B00000]">
                {assignment.isReturned
                  ? "Resubmission Required"
                  : assignment.isOverdue
                    ? "Overdue"
                    : "Action Required"}
              </p>

              <p className="mt-1 text-xs text-red-700">
                {assignment.isReturned
                  ? "Returned for revision"
                  : assignment.isOverdue
                    ? "Late submissions accepted"
                    : "Submit before the due date"}
              </p>
            </div>
          )}

          <button
            type="button"
            onClick={openAssignment}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition ${
              assignment.status === "Pending"
                ? "bg-[#B00000] text-white hover:bg-[#8f0000]"
                : assignment.status === "Submitted"
                  ? "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
                  : "bg-[#1E3A8A] text-white hover:bg-blue-900"
            }`}
          >
            {assignment.status === "Pending" ? (
              <>
                <FileText size={17} />
                View Assignment
              </>
            ) : assignment.status === "Submitted" ? (
              <>
                <FileCheck2 size={17} />
                View Submission
              </>
            ) : (
              <>
                <CheckCircle2 size={17} />
                View Grade
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assignments;
