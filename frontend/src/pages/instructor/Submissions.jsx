import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  Eye,
  FileText,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import { instructorSubmissionApi } from "../../api/instructorSubmissionApi";
import { formatScheduleDate } from "../../utils/scheduleFormat";

const getStatusStyles = (status) => {
  if (status === "Graded") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (status === "Returned") {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }

  return "bg-amber-50 text-amber-700 border-amber-200";
};

const StatusIcon = ({ status, size }) => {
  if (status === "Graded") return <CheckCircle2 size={size} />;
  if (status === "Returned") return <RotateCcw size={size} />;
  return <Clock3 size={size} />;
};

const getScoreStyles = (score, maxScore) => {
  if (score === null) return "text-gray-400";

  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) return "text-green-600";
  if (percentage >= 60) return "text-blue-600";

  return "text-orange-600";
};

const percentOf = (score, maxScore) =>
  maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;

const shortId = (id) => `#${id.slice(-6).toUpperCase()}`;

const Avatar = ({ student, size }) =>
  student.avatarUrl ? (
    <img
      src={student.avatarUrl}
      alt={student.name}
      className={`${size} shrink-0 rounded-full object-cover`}
    />
  ) : (
    <div
      className={`flex ${size} shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-secondary`}
    >
      {student.initials}
    </div>
  );

const Submissions = () => {
  const navigate = useNavigate();

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [assignmentFilter, setAssignmentFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const loadSubmissions = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await instructorSubmissionApi.list();
      setSubmissions(data.submissions);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Couldn't load your submissions.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  const courses = useMemo(
    () => ["All", ...new Set(submissions.map((item) => item.course))],
    [submissions],
  );

  const assignments = useMemo(
    () => ["All", ...new Set(submissions.map((item) => item.assignment))],
    [submissions],
  );

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((submission) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        submission.student.name.toLowerCase().includes(search) ||
        submission.assignment.toLowerCase().includes(search) ||
        submission.course.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || submission.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" || submission.course === courseFilter;

      const matchesAssignment =
        assignmentFilter === "All" ||
        submission.assignment === assignmentFilter;

      return (
        matchesSearch && matchesStatus && matchesCourse && matchesAssignment
      );
    });
  }, [submissions, searchTerm, statusFilter, courseFilter, assignmentFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSubmissions.length / itemsPerPage),
  );

  const paginatedSubmissions = filteredSubmissions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalSubmissions = submissions.length;

  const pendingReview = submissions.filter(
    (item) => item.status === "Pending Review",
  ).length;

  const gradedSubmissions = submissions.filter(
    (item) => item.status === "Graded",
  ).length;

  const lateSubmissions = submissions.filter(
    (item) => item.submittedLate,
  ).length;

  const gradedScores = submissions
    .filter((item) => item.status === "Graded" && item.score !== null)
    .map((item) => percentOf(item.score, item.maxScore));

  const averageScore =
    gradedScores.length > 0
      ? Math.round(
          gradedScores.reduce((sum, score) => sum + score, 0) /
            gradedScores.length,
        )
      : 0;

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCourseFilter("All");
    setAssignmentFilter("All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== "All" ||
    courseFilter !== "All" ||
    assignmentFilter !== "All";

  const openReview = (submission) => {
    navigate(`/dashboard/instructor/submissions/${submission.id}/review`);
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <FileText size={25} />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-900">
        {submissions.length === 0
          ? "No submissions yet"
          : "No submissions found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {submissions.length === 0
          ? "Student submissions for your assignments will appear here."
          : "Try adjusting your search or filters to find the submissions you are looking for."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 cursor-pointer text-sm font-semibold text-primary"
        >
          Clear filters
        </button>
      )}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* PAGE HEADER */}
      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardCheck size={24} className="text-primary" />

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Submissions
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Review student submissions, grade assignments and monitor academic
            performance across your courses.
          </p>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-xs font-semibold text-secondary">
            {loading ? "Loading..." : pendingReview} submission
            {pendingReview !== 1 ? "s" : ""} awaiting review
          </p>
        </div>
      </section>

      {loadError && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-primary sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            {loadError}
          </span>

          <button
            type="button"
            onClick={loadSubmissions}
            className="w-fit cursor-pointer rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STATS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-secondary">
              <FileText size={21} />
            </div>

            <span className="text-xs font-medium text-gray-400">All time</span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Total Submissions
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : totalSubmissions}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Clock3 size={21} />
            </div>

            <span className="rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700">
              Action needed
            </span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Pending Review
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : pendingReview}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={21} />
            </div>

            <span className="text-xs font-semibold text-green-600">
              Completed
            </span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">Graded</p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : gradedSubmissions}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary">
              <Clock3 size={21} />
            </div>

            <span className="text-xs font-semibold text-primary">Late</span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Late Submissions
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : lateSubmissions}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-secondary">
              <GraduationCap size={21} />
            </div>

            <span className="text-xs font-semibold text-secondary">
              Average
            </span>
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Average Score
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : `${averageScore}%`}
          </p>
        </div>
      </section>

      {/* FILTERS */}
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
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
                  setCurrentPage(1);
                }}
                placeholder="Search student, assignment or course..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-secondary focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                showFilters
                  ? "border-secondary bg-blue-50 text-secondary"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter size={17} />
              Filters
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-sm font-semibold text-primary transition hover:bg-red-50"
              >
                <X size={17} />
                Clear
              </button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 md:grid-cols-3">
              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600">
                  Status
                </label>

                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-secondary"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Graded">Graded</option>
                  <option value="Returned">Returned</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600">
                  Course
                </label>

                <select
                  value={courseFilter}
                  onChange={(e) => {
                    setCourseFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-secondary"
                >
                  {courses.map((course) => (
                    <option key={course} value={course}>
                      {course === "All" ? "All Courses" : course}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-gray-600">
                  Assignment
                </label>

                <select
                  value={assignmentFilter}
                  onChange={(e) => {
                    setAssignmentFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-secondary"
                >
                  {assignments.map((assignment) => (
                    <option key={assignment} value={assignment}>
                      {assignment === "All" ? "All Assignments" : assignment}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* DESKTOP TABLE */}
      <section className="hidden overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:block">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="animate-pulse space-y-2 px-5 py-5">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-275">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Assignment
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Submitted
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Score
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSubmissions.map((submission) => (
                    <tr
                      key={submission.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            student={submission.student}
                            size="h-10 w-10"
                          />

                          <div>
                            <p className="font-semibold text-gray-900">
                              {submission.student.name}
                            </p>

                            {submission.submittedLate && (
                              <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                                <Clock3 size={11} />
                                Submitted late
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-55 font-semibold text-gray-800">
                          {submission.assignment}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Submission {shortId(submission.id)}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <BookOpen size={15} className="text-gray-400" />
                          <span className="max-w-45">{submission.course}</span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600">
                          {formatScheduleDate(submission.submittedAt)}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        {submission.score !== null ? (
                          <div>
                            <span
                              className={`text-sm font-bold ${getScoreStyles(
                                submission.score,
                                submission.maxScore,
                              )}`}
                            >
                              {percentOf(submission.score, submission.maxScore)}
                              %
                            </span>

                            <p className="mt-1 text-xs text-gray-400">
                              {submission.score}/{submission.maxScore}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm font-medium text-gray-400">
                            Not graded
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${getStatusStyles(
                            submission.status,
                          )}`}
                        >
                          <StatusIcon status={submission.status} size={13} />

                          {submission.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openReview(submission)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          {submission.status === "Pending Review" ? (
                            <button
                              type="button"
                              onClick={() => openReview(submission)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#8f0000]"
                            >
                              <ClipboardCheck size={14} />
                              Grade
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => openReview(submission)}
                              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-secondary px-3 py-2 text-xs font-semibold text-secondary transition hover:bg-blue-50"
                            >
                              <Eye size={14} />
                              Review
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedSubmissions.length === 0 && emptyState}
          </>
        )}
      </section>

      {/* MOBILE / TABLET CARDS */}
      <section className="grid grid-cols-1 gap-4 lg:hidden">
        {loading ? (
          [1, 2].map((n) => (
            <div
              key={n}
              className="h-64 animate-pulse rounded-2xl border border-gray-200 bg-white"
            />
          ))
        ) : (
          <>
            {paginatedSubmissions.map((submission) => (
              <article
                key={submission.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar student={submission.student} size="h-11 w-11" />

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-gray-900">
                        {submission.student.name}
                      </h3>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Submission {shortId(submission.id)}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getStatusStyles(
                      submission.status,
                    )}`}
                  >
                    <StatusIcon status={submission.status} size={12} />

                    {submission.status}
                  </span>
                </div>

                <div className="mt-5 rounded-xl bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-secondary shadow-sm">
                      <FileText size={17} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-400">
                        Assignment
                      </p>

                      <p className="mt-1 font-semibold text-gray-900">
                        {submission.assignment}
                      </p>

                      <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                        <BookOpen size={12} />
                        {submission.course}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Submitted
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {formatScheduleDate(submission.submittedAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Score
                    </p>

                    {submission.score !== null ? (
                      <p
                        className={`mt-1 text-sm font-bold ${getScoreStyles(
                          submission.score,
                          submission.maxScore,
                        )}`}
                      >
                        {percentOf(submission.score, submission.maxScore)}%
                      </p>
                    ) : (
                      <p className="mt-1 text-sm font-semibold text-gray-400">
                        Pending
                      </p>
                    )}
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Points
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-700">
                      {submission.score !== null
                        ? `${submission.score}/${submission.maxScore}`
                        : `--/${submission.maxScore}`}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Timing
                    </p>

                    <p
                      className={`mt-1 text-xs font-semibold ${
                        submission.submittedLate
                          ? "text-primary"
                          : "text-green-600"
                      }`}
                    >
                      {submission.submittedLate ? "Late" : "On time"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => openReview(submission)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Eye size={15} />
                    View Submission
                  </button>

                  <button
                    type="button"
                    onClick={() => openReview(submission)}
                    className={`inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-xs font-semibold transition ${
                      submission.status === "Pending Review"
                        ? "bg-primary text-white hover:bg-[#8f0000]"
                        : "border border-secondary text-secondary hover:bg-blue-50"
                    }`}
                  >
                    {submission.status === "Pending Review" ? (
                      <>
                        <ClipboardCheck size={15} />
                        Grade Submission
                      </>
                    ) : (
                      <>
                        <Eye size={15} />
                        Review Submission
                      </>
                    )}
                  </button>
                </div>
              </article>
            ))}

            {paginatedSubmissions.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {emptyState}
              </div>
            )}
          </>
        )}
      </section>

      {/* PAGINATION */}
      {!loading && filteredSubmissions.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {Math.min(currentPage * itemsPerPage, filteredSubmissions.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {filteredSubmissions.length}
            </span>{" "}
            submissions
          </p>

          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft size={15} />
              Previous
            </button>

            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-secondary px-3 text-xs font-bold text-white">
              {currentPage}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(totalPages, page + 1))
              }
              className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight size={15} />
            </button>
          </div>
        </section>
      )}
    </div>
  );
};

export default Submissions;
