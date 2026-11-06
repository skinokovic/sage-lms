import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Plus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock3,
  Archive,
  BookOpen,
  Users,
  Star,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchAllCourses, deleteCourse } from "../../store/courseSlice";

const getInitials = (name) =>
  (name || "")
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "—";

const Courses = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    items: courses,
    listStatus,
    listError,
  } = useSelector((state) => state.courses);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [levelFilter, setLevelFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchAllCourses());
  }, [dispatch]);

  const stats = useMemo(() => {
    const totalStudents = courses.reduce(
      (total, course) => total + (course.students || 0),
      0,
    );

    const published = courses.filter(
      (course) => course.status === "Published",
    ).length;

    const draft = courses.filter((course) => course.status === "Draft").length;

    const archived = courses.filter(
      (course) => course.status === "Archived",
    ).length;

    return {
      total: courses.length,
      published,
      draft,
      archived,
      totalStudents,
    };
  }, [courses]);

  const categories = useMemo(() => {
    return [...new Set(courses.map((course) => course.category))];
  }, [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const searchValue = search.toLowerCase().trim();
      const instructorName = course.instructor?.name || "";

      const matchesSearch =
        !searchValue ||
        course.title.toLowerCase().includes(searchValue) ||
        course.category.toLowerCase().includes(searchValue) ||
        instructorName.toLowerCase().includes(searchValue);

      const matchesStatus =
        statusFilter === "All" || course.status === statusFilter;

      const matchesCategory =
        categoryFilter === "All" || course.category === categoryFilter;

      const matchesLevel =
        levelFilter === "All" || course.level === levelFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesLevel;
    });
  }, [courses, search, statusFilter, categoryFilter, levelFilter]);

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    categoryFilter !== "All" ||
    levelFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCategoryFilter("All");
    setLevelFilter("All");
  };

  const handleView = (course) => {
    navigate(`/dashboard/admin/courses/${course.id}/learn`);
  };

  const handleEdit = (course) => {
    navigate(`/dashboard/admin/courses/${course.id}/edit`);
  };

  const handleDelete = async (id) => {
    const course = courses.find((item) => item.id === id);

    if (!course) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove "${course.title}"?`,
    );

    if (!confirmed) return;

    try {
      await dispatch(deleteCourse(id)).unwrap();
      toast.success(`${course.title} removed successfully.`);
    } catch (err) {
      toast.error(err || "Unable to remove this course.");
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Published":
        return {
          badge: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle2,
        };

      case "Draft":
        return {
          badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: Clock3,
        };

      case "Archived":
        return {
          badge: "bg-gray-100 text-gray-600 border-gray-200",
          icon: Archive,
        };

      default:
        return {
          badge: "bg-gray-100 text-gray-600 border-gray-200",
          icon: Archive,
        };
    }
  };

  const getLevelStyle = (level) => {
    switch (level) {
      case "Beginner":
        return "bg-blue-50 text-blue-700";

      case "Intermediate":
        return "bg-purple-50 text-purple-700";

      case "Advanced":
        return "bg-red-50 text-red-700";

      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Courses
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage courses, instructors, content, pricing, and enrollments.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/courses/create")}
          className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          <Plus size={18} />
          Create Course
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Courses</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.total}
              </h2>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 text-[#1E3A8A]">
              <BookOpen size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Published</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.published}
              </h2>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Draft</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.draft}
              </h2>
            </div>
            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Archived</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.archived}
              </h2>
            </div>
            <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
              <Archive size={22} />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Enrollments</p>
              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.totalStudents.toLocaleString()}
              </h2>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-[#B00000]">
              <Users size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses by title, category or instructor..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>

          <div className="relative">
            <Filter
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full appearance-none rounded-lg border border-gray-300 bg-white py-2.5 pl-9 pr-9 text-sm outline-none focus:border-[#B00000] sm:w-44"
            >
              <option value="All">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] sm:w-52"
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
            onChange={(e) => setLevelFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] sm:w-44"
          >
            <option value="All">All Levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* LOADING */}
      {listStatus === "loading" && (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#B00000]" />
          <p className="mt-4 text-sm text-gray-500">Loading courses...</p>
        </div>
      )}

      {/* ERROR */}
      {listStatus === "failed" && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center text-sm text-[#B00000]">
          {listError || "Unable to load courses."}
        </div>
      )}

      {listStatus === "succeeded" && (
        <>
          {/* RESULT COUNT */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredCourses.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {courses.length}
              </span>{" "}
              courses
            </p>
          </div>

          {/* DESKTOP TABLE */}
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="border-b border-gray-200 bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Instructor
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Students
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Lessons
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Rating
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Price
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredCourses.map((course) => {
                    const statusStyle = getStatusStyle(course.status);
                    const StatusIcon = statusStyle.icon;

                    return (
                      <tr
                        key={course.id}
                        className="transition hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                              <BookOpen size={22} />
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[300px] font-semibold text-gray-900">
                                {course.title}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <span className="text-xs text-gray-500">
                                  {course.category}
                                </span>
                                <span
                                  className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${getLevelStyle(
                                    course.level,
                                  )}`}
                                >
                                  {course.level}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                              {getInitials(course.instructor?.name)}
                            </div>
                            <span className="text-sm font-medium text-gray-700">
                              {course.instructor?.name || "Unassigned"}
                            </span>
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                            <Users size={16} className="text-[#B00000]" />
                            {course.students || 0}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <div className="text-sm font-semibold text-gray-700">
                            {course.lessonCount ?? 0}
                          </div>
                          <p className="text-xs text-gray-400">
                            {course.duration}
                          </p>
                        </td>

                        <td className="px-6 py-4 text-center">
                          {course.rating > 0 ? (
                            <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                              <Star
                                size={16}
                                className="fill-yellow-400 text-yellow-400"
                              />
                              {course.rating}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">
                              No rating
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1 text-sm font-bold text-gray-900">
                            {/* <DollarSign size={15} className="text-[#B00000]" />₦ */}
                            ₦{course.price.toLocaleString("en-NG")}
                          </div>
                        </td>

                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}
                          >
                            <StatusIcon size={14} />
                            {course.status}
                          </span>
                        </td>

                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleView(course)}
                              title="View Course"
                              className="rounded-lg cursor-pointer p-2 text-gray-500 transition hover:bg-blue-50 hover:text-[#1E3A8A]"
                            >
                              <Eye size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEdit(course)}
                              title="Edit Course"
                              className="rounded-lg p-2 cursor-pointer text-gray-500 transition hover:bg-yellow-50 hover:text-yellow-600"
                            >
                              <Pencil size={18} />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDelete(course.id)}
                              title="Remove Course"
                              className="rounded-lg cursor-pointer p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 size={18} />
                            </button>

                            <button
                              onClick={() =>
                                navigate(
                                  `/dashboard/admin/courses/${course.id}/builder`,
                                )
                              }
                              type="button"
                              title="Manage course"
                              className="rounded-lg cursor-pointer p-2 text-gray-500 transition hover:bg-gray-100"
                            >
                              <MoreVertical size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS */}
          <div className="grid gap-4 md:hidden">
            {filteredCourses.map((course) => {
              const statusStyle = getStatusStyle(course.status);
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={course.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                        <BookOpen size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-gray-900">
                          {course.title}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {course.category}
                        </p>
                        <span
                          className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getLevelStyle(
                            course.level,
                          )}`}
                        >
                          {course.level}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                    >
                      <MoreVertical size={18} />
                    </button>
                  </div>

                  <div className="mt-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}
                    >
                      <StatusIcon size={14} />
                      {course.status}
                    </span>
                  </div>

                  <p className="mt-4 line-clamp-2 text-sm leading-6 text-gray-500">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                      {getInitials(course.instructor?.name)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Instructor</p>
                      <p className="text-sm font-semibold text-gray-800">
                        {course.instructor?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <Users size={17} className="mx-auto text-[#B00000]" />
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {course.students || 0}
                      </p>
                      <p className="text-xs text-gray-500">Students</p>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <BookOpen size={17} className="mx-auto text-[#1E3A8A]" />
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {course.lessonCount ?? 0}
                      </p>
                      <p className="text-xs text-gray-500">Lessons</p>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <Star
                        size={17}
                        className="mx-auto fill-yellow-400 text-yellow-400"
                      />
                      <p className="mt-1 text-lg font-bold text-gray-900">
                        {course.rating || "—"}
                      </p>
                      <p className="text-xs text-gray-500">Rating</p>
                    </div>

                    <div className="rounded-lg border border-gray-100 p-3 text-center">
                      <DollarSign
                        size={17}
                        className="mx-auto text-[#B00000]"
                      />
                      <p className="mt-1 text-sm font-bold text-gray-900">
                        ₦{course.price.toLocaleString("en-NG")}
                      </p>
                      <p className="text-xs text-gray-500">Price</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(course)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEdit(course)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                    >
                      <Pencil size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(course.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* EMPTY STATE */}
          {filteredCourses.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <GraduationCap size={28} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No courses found
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                Try changing your search or filters to find the course you are
                looking for.
              </p>
              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B00000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              )}
            </div>
          )}

          {/* PAGINATION */}
          {filteredCourses.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Page <span className="font-semibold text-gray-900">1</span> of{" "}
                <span className="font-semibold text-gray-900">1</span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400"
                >
                  <ChevronLeft size={16} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-400"
                >
                  Next
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Courses;
