import { useCallback, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  Eye,
  Filter,
  Loader2,
  MoreVertical,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { courseApi } from "../../api/courseApi"; // adjust the path to where this file lives

const COURSE_INDEX_KEY = "sage_instructor_course_index";
const PAGE_SIZE = 10;
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced", "All Levels"];

const EMPTY_STATS = {
  total: 0,
  published: 0,
  drafts: 0,
  archived: 0,
  totalStudents: 0,
};

const formatPrice = (price) =>
  !price ? "FREE" : `₦${Number(price).toLocaleString("en-NG")}`;

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const getStatusClasses = (status) => {
  if (status === "Published") {
    return "bg-green-50 text-green-700 border-green-200";
  }
  if (status === "Draft") {
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  }
  return "bg-gray-100 text-gray-600 border-gray-200";
};

const getLevelClasses = (level) => {
  if (level === "Beginner") return "bg-green-50 text-green-700";
  if (level === "Intermediate") return "bg-blue-50 text-blue-700";
  if (level === "Advanced") return "bg-purple-50 text-purple-700";
  return "bg-gray-100 text-gray-600";
};

// Same row shape the course builder / learning page already read from
// localStorage, now filled with real data.
const toIndexRow = (course) => ({
  id: course.id,
  title: course.title,
  category: course.category,
  level: course.level,
  students: course.students,
  lessons: course.lessons,
  duration: course.duration,
  rating: course.rating,
  price: course.price,
  status: course.status,
  completion: course.completion,
  updated: formatDate(course.updatedAt),
});

const readIndex = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(COURSE_INDEX_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const MyCourses = () => {
  const navigate = useNavigate();

  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);

  const requestId = useRef(0);

  const hasActiveFilters =
    Boolean(searchTerm.trim()) ||
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    levelFilter !== "All";

  // Wait for the instructor to stop typing before hitting the API.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const loadCourses = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");

    try {
      const { data } = await courseApi.mine({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch || undefined,
        status: statusFilter !== "All" ? statusFilter : undefined,
        category: categoryFilter !== "All" ? categoryFilter : undefined,
        level: levelFilter !== "All" ? levelFilter : undefined,
      });

      // Ignore a slow response that was overtaken by a newer request.
      if (currentRequest !== requestId.current) return;

      setCourses(data.courses || []);
      setStats(data.stats || EMPTY_STATS);
      setCategories(data.categories || []);
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
          "Couldn't load your courses. Please try again.",
      );
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, categoryFilter, levelFilter]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // Keep the course index available to CourseBuilder and the learning page.
  // Real courses replace the old placeholder rows (those had numeric ids).
  useEffect(() => {
    if (!courses.length) return;
    const incomingIds = new Set(courses.map((course) => course.id));
    const kept = readIndex().filter(
      (row) => typeof row.id === "string" && !incomingIds.has(row.id),
    );
    try {
      localStorage.setItem(
        COURSE_INDEX_KEY,
        JSON.stringify([...courses.map(toIndexRow), ...kept]),
      );
    } catch {
      // Storage can be full or blocked; the page works without it.
    }
  }, [courses]);

  const clearFilters = () => {
    setSearchTerm("");
    setDebouncedSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setLevelFilter("All");
    setPage(1);
  };

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  const handleDelete = async (course) => {
    const confirmed = window.confirm(
      `Remove "${course.title}"? Courses that already have students are archived instead of deleted.`,
    );
    if (!confirmed) return;

    setDeletingId(course.id);
    try {
      const { data } = await courseApi.remove(course.id);

      if (data?.archived) {
        toast.info(
          data.message ||
            "This course has enrolled students, so it was archived instead.",
        );
      } else {
        toast.success("Course removed successfully.");
        try {
          localStorage.setItem(
            COURSE_INDEX_KEY,
            JSON.stringify(readIndex().filter((row) => row.id !== course.id)),
          );
        } catch {
          // ignore storage errors
        }
      }

      // Deleting the last row of a later page: step back one page.
      if (!data?.archived && courses.length === 1 && page > 1) {
        setPage((current) => current - 1);
      } else {
        loadCourses();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Couldn't remove the course.");
    } finally {
      setDeletingId(null);
    }
  };

  const goToView = (course) =>
    navigate(`/dashboard/instructor/courses/${course.id}/learn`);
  const goToEdit = (course) =>
    navigate(`/dashboard/instructor/courses/${course.id}/edit`);
  const showMore = (course) => toast.info(`More options for "${course.title}"`);

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
        <option value="Published">Published</option>
        <option value="Draft">Draft</option>
        <option value="Archived">Archived</option>
      </select>

      <select
        value={categoryFilter}
        onChange={changeFilter(setCategoryFilter)}
        className={selectClass}
      >
        <option value="All">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>

      <select
        value={levelFilter}
        onChange={changeFilter(setLevelFilter)}
        className={selectClass}
      >
        {LEVELS.map((level) => (
          <option key={level} value={level}>
            {level === "All" ? "All Levels" : level}
          </option>
        ))}
      </select>
    </>
  );

  const showingFrom =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const showingTo = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  const isFirstLoad = loading && courses.length === 0 && !error;
  const noCoursesYet = !loading && !error && stats.total === 0;
  const noMatches =
    !loading && !error && stats.total > 0 && courses.length === 0;

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            My Courses
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Create, manage and monitor your courses.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/instructor/courses/create")}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] cursor-pointer"
        >
          <Plus size={18} />
          Create Course
        </button>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <BookOpen size={22} />
            </div>
            <span className="text-xs font-medium text-gray-400">
              All courses
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">{stats.total}</p>
          <p className="mt-1 text-sm text-gray-500">Total Courses</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={22} />
            </div>
            <span className="text-xs font-medium text-gray-400">Live</span>
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats.published}
          </p>
          <p className="mt-1 text-sm text-gray-500">Published</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Edit3 size={22} />
            </div>
            <span className="text-xs font-medium text-gray-400">
              Unpublished
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats.drafts}
          </p>
          <p className="mt-1 text-sm text-gray-500">Drafts</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <Clock3 size={22} />
            </div>
            <span className="text-xs font-medium text-gray-400">Hidden</span>
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats.archived}
          </p>
          <p className="mt-1 text-sm text-gray-500">Archived</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
              <Users size={22} />
            </div>
            <span className="text-xs font-medium text-gray-400">
              Across courses
            </span>
          </div>

          <p className="mt-4 text-2xl font-bold text-gray-900">
            {stats.totalStudents.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-gray-500">Total Students</p>
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
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search courses by title, category or level..."
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

          <div className="hidden items-center gap-3 lg:flex">
            {filterSelects}

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-3 text-sm font-semibold text-[#B00000] hover:bg-red-50 cursor-pointer"
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
            {filterSelects}

            <button
              type="button"
              onClick={clearFilters}
              className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-[#B00000] sm:col-span-3 cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </section>

      {/* Results */}
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-gray-900">Course List</h2>
            <p className="mt-1 text-xs text-gray-500">
              {pagination.total === 0
                ? "No courses to show"
                : `Showing ${showingFrom}–${showingTo} of ${pagination.total} courses`}
            </p>
          </div>

          {loading && !isFirstLoad && (
            <Loader2 size={18} className="animate-spin text-gray-400" />
          )}
        </div>

        {isFirstLoad && (
          <div className="flex items-center justify-center gap-3 px-6 py-16 text-sm text-gray-500">
            <Loader2 size={20} className="animate-spin" />
            Loading your courses…
          </div>
        )}

        {error && (
          <div className="px-6 py-16 text-center">
            <h3 className="font-semibold text-gray-900">
              Couldn't load your courses
            </h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
            <button
              type="button"
              onClick={loadCourses}
              className="mt-4 rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000] cursor-pointer"
            >
              Try again
            </button>
          </div>
        )}

        {noCoursesYet && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <BookOpen size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              You haven't created a course yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Create your first course to start teaching on SAGE.
            </p>

            <button
              type="button"
              onClick={() => navigate("/dashboard/instructor/courses/create")}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000] cursor-pointer"
            >
              <Plus size={16} />
              Create Course
            </button>
          </div>
        )}

        {noMatches && (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <BookOpen size={26} />
            </div>

            <h3 className="mt-4 font-semibold text-gray-900">
              No courses found
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-[#B00000] cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}

        {courses.length > 0 && !error && (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            {/* Desktop Table */}
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Level
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Students
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Content
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Completion
                    </th>
                    <th className="px-5 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Price
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
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-gray-100 last:border-0 hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {course.title}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {course.category}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getLevelClasses(
                            course.level,
                          )}`}
                        >
                          {course.level}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-700">
                          <Users size={16} className="text-gray-400" />
                          {course.students}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm text-gray-700">
                          <p>
                            {course.lessons}{" "}
                            {course.lessons === 1 ? "lesson" : "lessons"}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {course.duration || "Duration not set"}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {course.status === "Published" &&
                        course.students > 0 ? (
                          <div className="w-28">
                            <div className="mb-1 flex justify-between text-xs">
                              <span className="text-gray-400">Progress</span>
                              <span className="font-semibold text-gray-700">
                                {course.completion}%
                              </span>
                            </div>

                            <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
                              <div
                                className="h-full rounded-full bg-[#1E3A8A]"
                                style={{
                                  width: `${course.completion}%`,
                                }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {course.status === "Published"
                              ? "No students yet"
                              : "Not available"}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                        {formatPrice(course.price)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                            course.status,
                          )}`}
                        >
                          {course.status}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => goToView(course)}
                            title="View course"
                            className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A] cursor-pointer"
                          >
                            <Eye size={17} />
                          </button>

                          <button
                            type="button"
                            onClick={() => goToEdit(course)}
                            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(course)}
                            disabled={deletingId === course.id}
                            title="Remove course"
                            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-[#B00000] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {deletingId === course.id ? (
                              <Loader2 size={17} className="animate-spin" />
                            ) : (
                              <Trash2 size={17} />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => showMore(course)}
                            title="More options"
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                          >
                            <MoreVertical size={17} />
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
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="rounded-2xl border border-gray-200 bg-white p-4 transition hover:shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-bold leading-5 text-gray-900">
                        {course.title}
                      </h3>

                      <p className="mt-1 text-xs text-gray-500">
                        {course.category}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(
                        course.status,
                      )}`}
                    >
                      {course.status}
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getLevelClasses(
                        course.level,
                      )}`}
                    >
                      {course.level}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {course.lessons}{" "}
                      {course.lessons === 1 ? "lesson" : "lessons"}
                    </span>

                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                      {course.duration || "Duration not set"}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Users size={15} />
                        <span className="text-xs">Students</span>
                      </div>
                      <p className="mt-1 font-bold text-gray-900">
                        {course.students}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs text-gray-400">Price</p>
                      <p className="mt-1 font-bold text-gray-900">
                        {formatPrice(course.price)}
                      </p>
                    </div>
                  </div>

                  {course.status === "Published" && course.students > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 flex justify-between text-xs">
                        <span className="text-gray-500">Course completion</span>
                        <span className="font-semibold text-gray-700">
                          {course.completion}%
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#1E3A8A]"
                          style={{
                            width: `${course.completion}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                    <p className="text-xs text-gray-400">
                      Updated {formatDate(course.updatedAt)}
                    </p>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => goToView(course)}
                        className="rounded-lg p-2 text-gray-500 hover:bg-blue-50 hover:text-[#1E3A8A] cursor-pointer"
                        title="View course"
                      >
                        <Eye size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => goToEdit(course)}
                        className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 cursor-pointer"
                      >
                        <Edit3 className="h-4 w-4" />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(course)}
                        disabled={deletingId === course.id}
                        className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-[#B00000] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                        title="Remove course"
                      >
                        {deletingId === course.id ? (
                          <Loader2 size={17} className="animate-spin" />
                        ) : (
                          <Trash2 size={17} />
                        )}
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
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
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
                className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-white"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MyCourses;
