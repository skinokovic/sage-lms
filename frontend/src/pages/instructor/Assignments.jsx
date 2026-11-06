import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  Filter,
  Loader2,
  Lock,
  MoreVertical,
  Plus,
  Search,
  Send,
  Trash2,
  Unlock,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

import { instructorAssignmentApi } from "../../api/instructorAssignmentApi";
import {
  formatScheduleDate,
  formatScheduleTime,
} from "../../utils/scheduleFormat";

const ITEMS_PER_PAGE = 8;

const getStatusClasses = (status) => {
  if (status === "Published") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Draft") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-600";
};

const getTypeClasses = (type) => {
  if (type === "Project") {
    return "bg-purple-50 text-purple-700";
  }

  if (type === "Case Study") {
    return "bg-blue-50 text-blue-700";
  }

  if (type === "Practical") {
    return "bg-green-50 text-green-700";
  }

  return "bg-gray-100 text-gray-600";
};

const getSubmissionPercentage = (assignment) => {
  if (assignment.students === 0) return 0;

  return Math.min(
    100,
    Math.round((assignment.submissions / assignment.students) * 100),
  );
};

const getGradingPercentage = (assignment) => {
  if (assignment.submissions === 0) return 0;

  return Math.round((assignment.graded / assignment.submissions) * 100);
};

const Assignments = () => {
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [submissionFilter, setSubmissionFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [viewing, setViewing] = useState(null);
  const [optionsFor, setOptionsFor] = useState(null);
  const [busyId, setBusyId] = useState("");

  const loadAssignments = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await instructorAssignmentApi.list();
      setAssignments(data.assignments);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Couldn't load your assignments.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  const courses = useMemo(
    () => ["All", ...new Set(assignments.map((item) => item.course))],
    [assignments],
  );

  const stats = useMemo(() => {
    const live = assignments.filter((item) => item.status !== "Draft");
    const expected = live.reduce((total, item) => total + item.students, 0);
    const received = live.reduce((total, item) => total + item.submissions, 0);

    return {
      total: assignments.length,
      published: assignments.filter((item) => item.status === "Published")
        .length,
      drafts: assignments.filter((item) => item.status === "Draft").length,
      totalSubmissions: assignments.reduce(
        (total, item) => total + item.submissions,
        0,
      ),
      pendingGrading: assignments.reduce(
        (total, item) => total + item.pending,
        0,
      ),
      submissionRate:
        expected > 0
          ? Math.min(100, Math.round((received / expected) * 100))
          : 0,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        assignment.title.toLowerCase().includes(search) ||
        assignment.course.toLowerCase().includes(search) ||
        assignment.type.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || assignment.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" || assignment.course === courseFilter;

      const matchesSubmission =
        submissionFilter === "All" ||
        (submissionFilter === "Has Submissions" &&
          assignment.submissions > 0) ||
        (submissionFilter === "No Submissions" &&
          assignment.submissions === 0) ||
        (submissionFilter === "Needs Grading" && assignment.pending > 0) ||
        (submissionFilter === "Fully Graded" &&
          assignment.submissions > 0 &&
          assignment.graded === assignment.submissions);

      return (
        matchesSearch && matchesStatus && matchesCourse && matchesSubmission
      );
    });
  }, [assignments, searchTerm, statusFilter, courseFilter, submissionFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAssignments.length / ITEMS_PER_PAGE),
  );

  const pageItems = filteredAssignments.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "All" ||
    courseFilter !== "All" ||
    submissionFilter !== "All";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCourseFilter("All");
    setSubmissionFilter("All");
    setCurrentPage(1);
  };

  const resetPage = () => setCurrentPage(1);

  /* --------------------------------- actions --------------------------------- */

  const handleEdit = (assignment) => {
    setViewing(null);
    setOptionsFor(null);
    navigate(`/dashboard/instructor/assignments/${assignment.id}/edit`);
  };

  const handleViewSubmissions = () => {
    setViewing(null);
    setOptionsFor(null);
    navigate("/dashboard/instructor/submissions");
  };

  const handleDelete = async (assignment) => {
    const confirmed = window.confirm(
      `Delete "${assignment.title}"? This can't be undone.`,
    );

    if (!confirmed) return;

    setBusyId(assignment.id);

    try {
      await instructorAssignmentApi.remove(assignment.id);

      setAssignments((current) =>
        current.filter((item) => item.id !== assignment.id),
      );
      setViewing(null);
      setOptionsFor(null);
      toast.success("Assignment deleted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't delete this assignment.",
      );
    } finally {
      setBusyId("");
    }
  };

  const changeStatus = async (assignment, status) => {
    if (
      status === "Draft" &&
      assignment.submissions > 0 &&
      !window.confirm(
        "Students won't be able to see this assignment while it is a draft. Continue?",
      )
    ) {
      return;
    }

    setBusyId(assignment.id);

    try {
      const { data } = await instructorAssignmentApi.setStatus(
        assignment.id,
        status,
      );

      setAssignments((current) =>
        current.map((item) =>
          item.id === assignment.id ? data.assignment : item,
        ),
      );
      setOptionsFor(null);
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't change the status.",
      );
    } finally {
      setBusyId("");
    }
  };

  const handleDuplicate = async (assignment) => {
    setBusyId(assignment.id);

    try {
      const { data } = await instructorAssignmentApi.duplicate(assignment.id);

      setAssignments((current) => [data.assignment, ...current]);
      setOptionsFor(null);
      toast.success(data.message);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't duplicate this assignment.",
      );
    } finally {
      setBusyId("");
    }
  };

  const optionsAssignment = assignments.find((item) => item.id === optionsFor);

  /* ----------------------------- shared row actions ----------------------------- */

  const RowActions = ({ assignment }) => (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setViewing(assignment)}
        title="View assignment"
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A]"
      >
        <Eye size={17} />
      </button>

      <button
        type="button"
        onClick={() => handleEdit(assignment)}
        title="Edit assignment"
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-yellow-50 hover:text-yellow-600"
      >
        <Edit3 size={17} />
      </button>

      <button
        type="button"
        onClick={() => handleDelete(assignment)}
        disabled={busyId === assignment.id}
        title="Delete assignment"
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-[#B00000] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Trash2 size={17} />
      </button>

      <button
        type="button"
        onClick={() => setOptionsFor(assignment.id)}
        title="More options"
        className="cursor-pointer rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
      >
        <MoreVertical size={17} />
      </button>
    </div>
  );

  const emptyState = (
    <div className="px-6 py-16 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <FileText size={26} />
      </div>

      <h3 className="mt-4 font-semibold text-gray-900">
        {assignments.length === 0
          ? "No assignments yet"
          : "No assignments found"}
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        {assignments.length === 0
          ? "Create your first assignment to get started."
          : "Try changing your search or filters."}
      </p>

      {hasActiveFilters ? (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 cursor-pointer text-sm font-semibold text-[#B00000]"
        >
          Clear filters
        </button>
      ) : (
        assignments.length === 0 && (
          <button
            type="button"
            onClick={() => navigate("/dashboard/instructor/assignments/create")}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            <Plus size={16} />
            Create Assignment
          </button>
        )
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Assignments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create assignments, monitor submissions and review student work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/instructor/assignments/create")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          <Plus size={18} />
          Create Assignment
        </button>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-[#B00000] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            {loadError}
          </span>

          <button
            type="button"
            onClick={loadAssignments}
            className="w-fit cursor-pointer rounded-xl bg-[#B00000] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <FileText size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : stats.total}
          </p>

          <p className="mt-1 text-sm text-gray-500">Total Assignments</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <CheckCircle2 size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : stats.published}
          </p>

          <p className="mt-1 text-sm text-gray-500">Published</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
            <Edit3 size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : stats.drafts}
          </p>

          <p className="mt-1 text-sm text-gray-500">Drafts</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Users size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : stats.totalSubmissions}
          </p>

          <p className="mt-1 text-sm text-gray-500">Submissions</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
            <ClipboardCheck size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : stats.pendingGrading}
          </p>

          <p className="mt-1 text-sm text-gray-500">Needs Grading</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <Clock3 size={22} />
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {loading ? "—" : `${stats.submissionRate}%`}
          </p>

          <p className="mt-1 text-sm text-gray-500">Submission Rate</p>
        </div>
      </section>

      {/* Search + Filters */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                resetPage();
              }}
              placeholder="Search assignments by title, course or type..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
          >
            <Filter size={18} />
            Filters
          </button>

          {/* Desktop Filters */}
          <div className="hidden items-center gap-3 lg:flex">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                resetPage();
              }}
              className="max-w-[220px] cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course === "All" ? "All Courses" : course}
                </option>
              ))}
            </select>

            <select
              value={submissionFilter}
              onChange={(e) => {
                setSubmissionFilter(e.target.value);
                resetPage();
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              <option value="All">All Submissions</option>
              <option value="Has Submissions">Has Submissions</option>
              <option value="No Submissions">No Submissions</option>
              <option value="Needs Grading">Needs Grading</option>
              <option value="Fully Graded">Fully Graded</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold text-[#B00000] hover:bg-red-50"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3 lg:hidden">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                resetPage();
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Closed">Closed</option>
            </select>

            <select
              value={courseFilter}
              onChange={(e) => {
                setCourseFilter(e.target.value);
                resetPage();
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              {courses.map((course) => (
                <option key={course} value={course}>
                  {course === "All" ? "All Courses" : course}
                </option>
              ))}
            </select>

            <select
              value={submissionFilter}
              onChange={(e) => {
                setSubmissionFilter(e.target.value);
                resetPage();
              }}
              className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
            >
              <option value="All">All Submissions</option>
              <option value="Has Submissions">Has Submissions</option>
              <option value="No Submissions">No Submissions</option>
              <option value="Needs Grading">Needs Grading</option>
              <option value="Fully Graded">Fully Graded</option>
            </select>

            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#B00000] sm:col-span-3"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Assignment List */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">Assignment List</h2>

            <p className="mt-1 text-xs text-gray-500">
              Showing {filteredAssignments.length} of {assignments.length}{" "}
              assignments
            </p>
          </div>
        </div>

        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-2 px-5 py-5">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : filteredAssignments.length === 0 ? (
          emptyState
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1250px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Assignment
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Students
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Submissions
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Grading
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Due Date
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {pageItems.map((assignment) => {
                    const submissionPercentage =
                      getSubmissionPercentage(assignment);

                    const gradingPercentage = getGradingPercentage(assignment);

                    return (
                      <tr
                        key={assignment.id}
                        className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                      >
                        {/* Assignment */}
                        <td className="px-5 py-4">
                          <div className="max-w-[260px]">
                            <p className="font-semibold text-gray-900">
                              {assignment.title}
                            </p>

                            <div className="mt-2 flex items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                                  assignment.type,
                                )}`}
                              >
                                {assignment.type}
                              </span>

                              <span className="text-xs text-gray-400">
                                {assignment.points} points
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Course */}
                        <td className="px-5 py-4">
                          <div className="flex max-w-[210px] items-start gap-2">
                            <BookOpen
                              size={16}
                              className="mt-0.5 shrink-0 text-gray-400"
                            />

                            <span className="text-sm text-gray-700">
                              {assignment.course}
                            </span>
                          </div>
                        </td>

                        {/* Students */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-700">
                            <Users size={16} className="text-gray-400" />
                            {assignment.students}
                          </div>
                        </td>

                        {/* Submissions */}
                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-gray-400">
                                {assignment.submissions}/{assignment.students}
                              </span>

                              <span className="font-semibold text-gray-700">
                                {submissionPercentage}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-[#1E3A8A]"
                                style={{
                                  width: `${submissionPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Grading */}
                        <td className="px-5 py-4">
                          <div className="w-32">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-gray-400">
                                {assignment.graded}/{assignment.submissions}
                              </span>

                              <span className="font-semibold text-gray-700">
                                {gradingPercentage}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className={`h-full rounded-full ${
                                  assignment.pending > 0
                                    ? "bg-[#B00000]"
                                    : "bg-green-500"
                                }`}
                                style={{
                                  width: `${gradingPercentage}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Due Date */}
                        <td className="px-5 py-4">
                          <p className="text-sm text-gray-700">
                            {assignment.dueDate
                              ? formatScheduleDate(assignment.dueDate)
                              : "No due date"}
                          </p>

                          <p className="mt-1 text-xs text-gray-400">
                            Created {formatScheduleDate(assignment.createdAt)}
                          </p>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                              assignment.status,
                            )}`}
                          >
                            {assignment.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <RowActions assignment={assignment} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {pageItems.map((assignment) => {
                const submissionPercentage =
                  getSubmissionPercentage(assignment);

                const gradingPercentage = getGradingPercentage(assignment);

                return (
                  <article
                    key={assignment.id}
                    className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold leading-5 text-gray-900">
                          {assignment.title}
                        </h3>

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                          <BookOpen size={13} />
                          {assignment.course}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                          assignment.status,
                        )}`}
                      >
                        {assignment.status}
                      </span>
                    </div>

                    {/* Type + Points */}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                          assignment.type,
                        )}`}
                      >
                        {assignment.type}
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {assignment.points} points
                      </span>

                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        Due{" "}
                        {assignment.dueDate
                          ? formatScheduleDate(assignment.dueDate)
                          : "—"}
                      </span>
                    </div>

                    {/* Stats */}
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Users size={15} />
                          <span className="text-xs">Students</span>
                        </div>

                        <p className="mt-1 font-bold text-gray-900">
                          {assignment.students}
                        </p>
                      </div>

                      <div className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 text-gray-400">
                          <FileText size={15} />
                          <span className="text-xs">Submissions</span>
                        </div>

                        <p className="mt-1 font-bold text-gray-900">
                          {assignment.submissions}/{assignment.students}
                        </p>
                      </div>
                    </div>

                    {/* Submission Progress */}
                    <div className="mt-5">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-gray-500">
                          Submission progress
                        </span>

                        <span className="font-semibold text-gray-700">
                          {submissionPercentage}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#1E3A8A]"
                          style={{
                            width: `${submissionPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Grading Progress */}
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-gray-500">Grading progress</span>

                        <span className="font-semibold text-gray-700">
                          {assignment.graded}/{assignment.submissions}
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full ${
                            assignment.pending > 0
                              ? "bg-[#B00000]"
                              : "bg-green-500"
                          }`}
                          style={{
                            width: `${gradingPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                      <p className="text-xs text-gray-400">
                        Created {formatScheduleDate(assignment.createdAt)}
                      </p>

                      <RowActions assignment={assignment} />
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && filteredAssignments.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-700">{currentPage}</span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">{totalPages}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={15} />
                Previous
              </button>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(totalPages, page + 1))
                }
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewing(null)}
            className="absolute inset-0 cursor-pointer bg-black/50"
          />

          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getTypeClasses(
                      viewing.type,
                    )}`}
                  >
                    {viewing.type}
                  </span>

                  <span
                    className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                      viewing.status,
                    )}`}
                  >
                    {viewing.status}
                  </span>
                </div>

                <h2 className="mt-3 text-lg font-bold text-gray-900">
                  {viewing.title}
                </h2>

                <p className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <BookOpen size={14} />
                  {viewing.course}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setViewing(null)}
                className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Total marks", viewing.points],
                ["Students", viewing.students],
                ["Submissions", `${viewing.submissions}/${viewing.students}`],
                ["Graded", `${viewing.graded}/${viewing.submissions}`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-gray-50 p-3">
                  <p className="text-[11px] font-medium text-gray-400">
                    {label}
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-medium text-gray-400">
                  Due date (WAT)
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {viewing.dueDate
                    ? `${formatScheduleDate(viewing.dueDate)}, ${formatScheduleTime(
                        viewing.dueDate,
                      )}`
                    : "No due date"}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-3">
                <p className="text-[11px] font-medium text-gray-400">
                  Submission
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {viewing.submissionType}
                  {viewing.attachmentRequired ? " (file required)" : ""} ·{" "}
                  {viewing.allowLateSubmission
                    ? "late allowed"
                    : "no late submissions"}
                </p>
              </div>
            </div>

            {viewing.description && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Description
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {viewing.description}
                </p>
              </div>
            )}

            {viewing.instructions && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Instructions
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {viewing.instructions}
                </p>
              </div>
            )}

            {viewing.resources.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Resources
                </p>

                <div className="mt-2 space-y-2">
                  {viewing.resources.map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm transition hover:bg-gray-50"
                    >
                      <span className="truncate font-medium text-gray-700">
                        {resource.name}
                      </span>

                      <ExternalLink
                        size={15}
                        className="shrink-0 text-gray-400"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={handleViewSubmissions}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <ClipboardCheck size={16} />
                View Submissions
              </button>

              <button
                type="button"
                onClick={() => handleEdit(viewing)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                <Edit3 size={16} />
                Edit Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MORE OPTIONS */}
      {optionsAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setOptionsFor(null)}
            className="absolute inset-0 cursor-pointer bg-black/50"
          />

          <div className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Options
                </p>

                <h2 className="mt-1 truncate font-bold text-gray-900">
                  {optionsAssignment.title}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setOptionsFor(null)}
                className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-4 space-y-1">
              <OptionButton
                icon={ClipboardCheck}
                label="View submissions"
                onClick={handleViewSubmissions}
              />

              {optionsAssignment.status === "Draft" && (
                <OptionButton
                  icon={Send}
                  label="Publish to students"
                  busy={busyId === optionsAssignment.id}
                  onClick={() => changeStatus(optionsAssignment, "Published")}
                />
              )}

              {optionsAssignment.status === "Published" && (
                <>
                  <OptionButton
                    icon={Lock}
                    label="Close submissions"
                    busy={busyId === optionsAssignment.id}
                    onClick={() => changeStatus(optionsAssignment, "Closed")}
                  />

                  <OptionButton
                    icon={Edit3}
                    label="Move back to draft"
                    busy={busyId === optionsAssignment.id}
                    onClick={() => changeStatus(optionsAssignment, "Draft")}
                  />
                </>
              )}

              {optionsAssignment.status === "Closed" && (
                <OptionButton
                  icon={Unlock}
                  label="Reopen for submissions"
                  busy={busyId === optionsAssignment.id}
                  onClick={() => changeStatus(optionsAssignment, "Published")}
                />
              )}

              <OptionButton
                icon={Copy}
                label="Duplicate as draft"
                busy={busyId === optionsAssignment.id}
                onClick={() => handleDuplicate(optionsAssignment)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const OptionButton = ({ icon: Icon, label, onClick, busy = false }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={busy}
    className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {busy ? (
      <Loader2 size={17} className="animate-spin text-gray-400" />
    ) : (
      <Icon size={17} className="text-[#1E3A8A]" />
    )}
    {label}
  </button>
);

export default Assignments;
