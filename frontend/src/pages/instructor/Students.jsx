import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Filter,
  Loader2,
  Mail,
  Search,
  UserCheck,
  UserX,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { instructorStudentApi } from "../../api/instructorStudentApi";

const PAGE_SIZE = 10;

const EMPTY_STATS = {
  totalStudents: 0,
  activeStudents: 0,
  pendingStudents: 0,
  inactiveStudents: 0,
  averageProgress: 0,
  averageScore: null,
};

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const timeAgo = (value) => {
  if (!value) return "Never";

  const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
};

const getInitials = (name) =>
  String(name || "?")
    .split(" ")
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const getStatusClasses = (status) => {
  if (status === "Active") {
    return "border-green-200 bg-green-50 text-green-700";
  }

  if (status === "Pending") {
    return "border-yellow-200 bg-yellow-50 text-yellow-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-600";
};

const getProgressClasses = (progress) => {
  if (progress >= 80) return "bg-green-500";
  if (progress >= 50) return "bg-[#1E3A8A]";
  return "bg-[#B00000]";
};

const scoreText = (value) =>
  value === null || value === undefined ? "—" : `${value}%`;

const Students = () => {
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [courseOptions, setCourseOptions] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [courseCountFilter, setCourseCountFilter] = useState("All");
  const [progressFilter, setProgressFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const [selectedId, setSelectedId] = useState(null);

  const requestId = useRef(0);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== "All" ||
    courseFilter !== "All" ||
    courseCountFilter !== "All" ||
    progressFilter !== "All";

  // Wait for the instructor to stop typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadStudents = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");

    try {
      const { data } = await instructorStudentApi.list({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        course: courseFilter !== "All" ? courseFilter : undefined,
        courseCount:
          courseCountFilter !== "All" ? courseCountFilter : undefined,
        progress: progressFilter !== "All" ? progressFilter : undefined,
      });

      if (currentRequest !== requestId.current) return;

      setStudents(data.students || []);
      setStats(data.stats || EMPTY_STATS);
      setCourseOptions(data.courses || []);
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
          "Couldn't load your students. Please try again.",
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [
    page,
    debouncedSearch,
    statusFilter,
    courseFilter,
    courseCountFilter,
    progressFilter,
  ]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setCourseFilter("All");
    setCourseCountFilter("All");
    setProgressFilter("All");
    setPage(1);
  };

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleMessageStudent = (student) => {
    if (!student.email) {
      toast.error("This student has no email address.");
      return;
    }

    window.location.href = `mailto:${student.email}`;
  };

  const selectClass =
    "rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]";

  const filterSelects = (
    <>
      <select
        value={statusFilter}
        onChange={changeFilter(setStatusFilter)}
        className={selectClass}
      >
        <option value="All">All Status</option>
        <option value="Active">Active</option>
        <option value="Pending">Pending</option>
        <option value="Inactive">Inactive</option>
      </select>

      <select
        value={courseFilter}
        onChange={changeFilter(setCourseFilter)}
        className={`${selectClass} max-w-[220px]`}
      >
        <option value="All">All My Courses</option>
        {courseOptions.map((course) => (
          <option key={course.id} value={course.id}>
            {course.title}
          </option>
        ))}
      </select>

      <select
        value={courseCountFilter}
        onChange={changeFilter(setCourseCountFilter)}
        className={selectClass}
      >
        <option value="All">Any Number of Courses</option>
        <option value="1">1 Course</option>
        <option value="2">2 Courses</option>
        <option value="3+">3+ Courses</option>
      </select>

      <select
        value={progressFilter}
        onChange={changeFilter(setProgressFilter)}
        className={selectClass}
      >
        <option value="All">All Progress</option>
        <option value="High">High — 80%+</option>
        <option value="Medium">Medium — 50–79%</option>
        <option value="Low">Low — Below 50%</option>
      </select>
    </>
  );

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  const isFirstLoad = loading && students.length === 0 && !error;
  const noStudentsYet = !loading && !error && stats.totalStudents === 0;
  const noMatches =
    !loading && !error && stats.totalStudents > 0 && students.length === 0;

  const statCards = [
    {
      label: "Total Students",
      value: stats.totalStudents,
      icon: UserCheck,
      tone: "bg-blue-50 text-[#1E3A8A]",
    },
    {
      label: "Active Students",
      value: stats.activeStudents,
      icon: CheckCircle2,
      tone: "bg-green-50 text-green-600",
    },
    {
      label: "Pending",
      value: stats.pendingStudents,
      icon: UserCheck,
      tone: "bg-yellow-50 text-yellow-600",
    },
    {
      label: "Inactive",
      value: stats.inactiveStudents,
      icon: UserX,
      tone: "bg-gray-100 text-gray-600",
    },
    {
      label: "Avg. Progress",
      value: `${stats.averageProgress}%`,
      icon: BookOpen,
      tone: "bg-red-50 text-[#B00000]",
    },
    {
      label: "Avg. Score",
      value: scoreText(stats.averageScore),
      icon: CheckCircle2,
      tone: "bg-purple-50 text-purple-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header */}
      <section>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            My Students
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Monitor students enrolled in your courses and track their learning
            progress.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {statCards.map(({ label, value, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}
            >
              <Icon size={22} />
            </div>

            <p className="mt-4 text-2xl font-bold text-gray-900">{value}</p>

            <p className="mt-1 text-sm text-gray-500">{label}</p>
          </div>
        ))}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search students by name, email or phone..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E3A8A] focus:bg-white"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowFilters((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 lg:hidden"
          >
            <Filter size={18} />
            Filters
          </button>

          {/* Desktop Filters */}
          <div className="hidden flex-wrap items-center gap-3 lg:flex">
            {filterSelects}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold text-[#B00000] hover:bg-red-50"
              >
                <X size={16} />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2 lg:hidden">
            {filterSelects}

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#B00000] sm:col-span-2"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Student List */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">Student List</h2>

            <p className="mt-1 text-xs text-gray-500">
              {pagination.total === 0
                ? "No students to show"
                : `Showing ${showingFrom}–${showingTo} of ${pagination.total} students`}
            </p>
          </div>

          {loading && !isFirstLoad && (
            <Loader2 size={18} className="animate-spin text-gray-400" />
          )}
        </div>

        {isFirstLoad && (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Loading your students…
          </div>
        )}

        {error && (
          <div className="px-6 py-16 text-center">
            <h3 className="font-semibold text-gray-900">
              Couldn't load your students
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={loadStudents}
              className="mt-4 rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000]"
            >
              Try again
            </button>
          </div>
        )}

        {noStudentsYet && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No students yet
            </h3>

            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Students appear here once they enroll in one of your published
              courses.
            </p>
          </div>
        )}

        {noMatches && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <Users size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No students found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-[#B00000]"
            >
              Clear filters
            </button>
          </div>
        )}

        {students.length > 0 && !error && (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    {[
                      "Student",
                      "Courses",
                      "Progress",
                      "Assignments",
                      "Avg. Score",
                      "Status",
                      "Last Active",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {students.map((student) => (
                    <tr
                      key={student.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                    >
                      {/* Student */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-bold text-white">
                            {getInitials(student.name)}
                          </div>

                          <div className="min-w-0">
                            <p className="font-semibold text-gray-900">
                              {student.name}
                            </p>

                            <p className="mt-1 text-xs text-gray-500">
                              {student.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Courses */}
                      <td className="px-5 py-4">
                        <p className="text-sm font-semibold text-gray-800">
                          {student.courses}{" "}
                          {student.courses === 1 ? "course" : "courses"}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {student.completed} completed
                        </p>
                      </td>

                      {/* Progress */}
                      <td className="px-5 py-4">
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              Progress
                            </span>

                            <span className="text-xs font-semibold text-gray-700">
                              {student.progress}%
                            </span>
                          </div>

                          <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                            <div
                              className={`h-full rounded-full ${getProgressClasses(
                                student.progress,
                              )}`}
                              style={{ width: `${student.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Assignments */}
                      <td className="px-5 py-4">
                        {student.assignments > 0 ? (
                          <>
                            <p className="text-sm font-semibold text-gray-800">
                              {student.submitted}/{student.assignments}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              submitted
                            </p>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">
                            None assigned
                          </span>
                        )}
                      </td>

                      {/* Score */}
                      <td className="px-5 py-4">
                        <span className="text-sm font-bold text-gray-800">
                          {scoreText(student.averageScore)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            student.status,
                          )}`}
                        >
                          {student.status}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="px-5 py-4">
                        <p className="text-sm text-gray-700">
                          {timeAgo(student.lastActive)}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          Joined {formatDate(student.joined)}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => setSelectedId(student.id)}
                            title="View progress"
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A]"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleMessageStudent(student)}
                            title="Email student"
                            className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                          >
                            <Mail size={17} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards */}
            <div className="grid grid-cols-1 gap-4 p-4 lg:hidden">
              {students.map((student) => (
                <article
                  key={student.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-xs font-bold text-white">
                        {getInitials(student.name)}
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-gray-900">
                          {student.name}
                        </h3>

                        <p className="mt-1 truncate text-xs text-gray-500">
                          {student.email}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        student.status,
                      )}`}
                    >
                      {student.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Courses</p>

                      <p className="mt-1 font-bold text-gray-900">
                        {student.courses}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        {student.completed} completed
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Avg. Score</p>

                      <p className="mt-1 font-bold text-gray-900">
                        {scoreText(student.averageScore)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Overall performance
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Assignments</p>

                      <p className="mt-1 font-bold text-gray-900">
                        {student.assignments > 0
                          ? `${student.submitted}/${student.assignments}`
                          : "—"}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">Submitted</p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Last Active</p>

                      <p className="mt-1 font-bold text-gray-900">
                        {timeAgo(student.lastActive)}
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Joined {formatDate(student.joined)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-gray-500">Learning progress</span>

                      <span className="font-semibold text-gray-700">
                        {student.progress}%
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${getProgressClasses(
                          student.progress,
                        )}`}
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                      {student.phone || "No phone number"}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedId(student.id)}
                        title="View progress"
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A]"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMessageStudent(student)}
                        title="Email student"
                        className="rounded-lg p-2 text-gray-500 hover:bg-green-50 hover:text-green-600"
                      >
                        <Mail size={17} />
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {pagination.total > 0 && !error && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Page{" "}
              <span className="font-semibold text-gray-700">
                {pagination.page}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {pagination.totalPages}
              </span>
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

      {selectedId && (
        <StudentDetailPanel
          studentId={selectedId}
          onClose={() => setSelectedId(null)}
          onEmail={handleMessageStudent}
        />
      )}
    </div>
  );
};

/* ============================================================
   STUDENT DETAIL PANEL
============================================================ */

const StudentDetailPanel = ({ studentId, onClose, onEmail }) => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const { data } = await instructorStudentApi.getById(studentId);
        if (!cancelled) setStudent(data.student);
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.message || "Couldn't load this student.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [studentId]);

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        aria-label="Close student details"
        onClick={onClose}
        className="absolute inset-0 bg-black/50"
      />

      <div className="absolute right-0 top-0 flex h-full w-[min(96vw,520px)] flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <h2 className="text-base font-bold text-gray-900">
            Student Progress
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading && (
            <div className="flex items-center justify-center gap-3 py-16 text-sm text-gray-500">
              <Loader2 size={20} className="animate-spin" />
              Loading…
            </div>
          )}

          {error && !loading && (
            <p className="py-16 text-center text-sm text-gray-500">{error}</p>
          )}

          {student && !loading && (
            <div className="space-y-6">
              {/* Identity */}
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-sm font-bold text-white">
                  {getInitials(student.name)}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-lg font-bold text-gray-900">
                    {student.name}
                  </h3>
                  <p className="truncate text-sm text-gray-500">
                    {student.email}
                  </p>
                  {student.phone && (
                    <p className="text-sm text-gray-500">{student.phone}</p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        student.status,
                      )}`}
                    >
                      {student.status}
                    </span>
                    <span className="text-xs text-gray-400">
                      Joined {formatDate(student.joined)} · Last active{" "}
                      {timeAgo(student.lastActive).toLowerCase()}
                    </span>
                  </div>
                </div>
              </div>

              {!student.hasAccount && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                  This student paid for a course without a linked account, so
                  progress and assignments can't be tracked yet.
                </div>
              )}

              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Courses</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {student.courses}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Progress</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {student.progress}%
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50 p-3 text-center">
                  <p className="text-xs text-gray-400">Avg. Score</p>
                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {scoreText(student.averageScore)}
                  </p>
                </div>
              </div>

              {/* Per course */}
              <div>
                <h4 className="text-sm font-bold text-gray-900">
                  Your courses
                </h4>

                <div className="mt-3 space-y-3">
                  {student.courseDetails.map((detail) => (
                    <div
                      key={detail.courseId}
                      className="rounded-xl border border-gray-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 text-sm font-semibold text-gray-900">
                          {detail.title}
                        </p>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                            detail.status === "completed"
                              ? "bg-green-50 text-green-700"
                              : "bg-blue-50 text-blue-700"
                          }`}
                        >
                          {detail.status === "completed"
                            ? "Completed"
                            : "In progress"}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="mb-1 flex justify-between text-xs">
                          <span className="text-gray-500">
                            {detail.completedLessons} of {detail.totalLessons}{" "}
                            lessons
                          </span>
                          <span className="font-semibold text-gray-700">
                            {detail.progress}%
                          </span>
                        </div>

                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className={`h-full rounded-full ${getProgressClasses(
                              detail.progress,
                            )}`}
                            style={{ width: `${detail.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                        <span>
                          Assignments:{" "}
                          {detail.assignments > 0
                            ? `${detail.submitted}/${detail.assignments} submitted`
                            : "none assigned"}
                        </span>
                        <span>Score: {scoreText(detail.averageScore)}</span>
                        <span>Enrolled {formatDate(detail.enrolledAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {student && !loading && (
          <div className="border-t border-gray-200 p-4">
            <button
              type="button"
              onClick={() => onEmail(student)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#172f70]"
            >
              <Mail size={17} />
              Email {student.name.split(" ")[0]}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Students;
