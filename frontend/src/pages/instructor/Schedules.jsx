import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Edit3,
  ExternalLink,
  Eye,
  Filter,
  MapPin,
  Plus,
  Search,
  Trash2,
  Users,
  Video,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { scheduleApi } from "../../api/scheduleApi";
import {
  formatScheduleDate,
  formatScheduleDay,
  formatScheduleTime,
} from "../../utils/scheduleFormat";

const getTypeStyles = (type) => {
  if (type === "Practical") {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }

  if (type === "Office Hours") {
    return "bg-green-50 text-green-700 border-green-200";
  }

  if (type === "Seminar") {
    return "bg-orange-50 text-orange-700 border-orange-200";
  }

  if (type === "Review") {
    return "bg-pink-50 text-pink-700 border-pink-200";
  }

  return "bg-blue-50 text-[#1E3A8A] border-blue-200";
};

const statusClass = (status) =>
  status === "In Progress"
    ? "text-green-600"
    : status === "Cancelled"
      ? "text-[#B00000]"
      : "text-gray-400";

const Schedules = () => {
  const navigate = useNavigate();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [modeFilter, setModeFilter] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 8;

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await scheduleApi.list();
      setSchedules(data.schedules);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Couldn't load your schedules.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  const courses = useMemo(
    () => ["All", ...new Set(schedules.map((item) => item.course))],
    [schedules],
  );

  const types = useMemo(
    () => ["All", ...new Set(schedules.map((item) => item.type))],
    [schedules],
  );

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        schedule.title.toLowerCase().includes(search) ||
        schedule.course.toLowerCase().includes(search) ||
        schedule.type.toLowerCase().includes(search);

      const matchesType = typeFilter === "All" || schedule.type === typeFilter;

      const matchesCourse =
        courseFilter === "All" || schedule.course === courseFilter;

      const matchesMode = modeFilter === "All" || schedule.mode === modeFilter;

      return matchesSearch && matchesType && matchesCourse && matchesMode;
    });
  }, [schedules, searchTerm, typeFilter, courseFilter, modeFilter]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredSchedules.length / itemsPerPage),
  );

  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const upcomingCount = schedules.filter(
    (item) => item.status === "Upcoming" || item.status === "In Progress",
  ).length;

  const onlineCount = schedules.filter((item) => item.mode === "Online").length;

  const physicalCount = schedules.filter(
    (item) => item.mode === "Physical",
  ).length;

  const totalStudents = schedules.reduce((sum, item) => sum + item.students, 0);

  const clearFilters = () => {
    setSearchTerm("");
    setTypeFilter("All");
    setCourseFilter("All");
    setModeFilter("All");
    setCurrentPage(1);
  };

  const hasActiveFilters =
    searchTerm ||
    typeFilter !== "All" ||
    courseFilter !== "All" ||
    modeFilter !== "All";

  const handleEdit = (schedule) => {
    navigate(`/dashboard/instructor/schedules/${schedule.id}/edit`);
  };

  const handleDelete = async (id) => {
    const schedule = schedules.find((item) => item.id === id);

    if (!schedule) return;

    const confirmed = window.confirm(
      `Remove "${schedule.title}" from your schedule?`,
    );

    if (!confirmed) return;

    try {
      await scheduleApi.remove(id);

      setSchedules((current) => current.filter((item) => item.id !== id));
      toast.success("Schedule removed successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't remove this schedule.",
      );
    }
  };

  const emptyState = (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <CalendarDays size={25} />
      </div>

      <h3 className="mt-4 text-base font-bold text-gray-900">
        {schedules.length === 0 ? "No schedules yet" : "No schedules found"}
      </h3>

      <p className="mt-1 max-w-sm text-sm text-gray-500">
        {schedules.length === 0
          ? "Create your first schedule to let students know when your next session is."
          : "Try adjusting your search or filters to find the schedule you are looking for."}
      </p>

      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="mt-4 cursor-pointer text-sm font-semibold text-[#B00000]"
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
            <CalendarDays size={25} className="text-[#B00000]" />

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Schedules
            </h1>
          </div>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Plan your classes, practical sessions, seminars and student meetings
            in one place.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/instructor/schedules/create")}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f0000]"
        >
          <Plus size={18} />
          Create Schedule
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
            onClick={loadSchedules}
            className="w-fit cursor-pointer rounded-xl bg-[#B00000] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* STATS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <CalendarDays size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Total Schedules
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : schedules.length}
          </p>

          <p className="mt-1 text-xs text-gray-400">Teaching activities</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Clock3 size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">Upcoming</p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : upcomingCount}
          </p>

          <p className="mt-1 text-xs text-gray-400">Scheduled activities</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Video size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Online Sessions
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : onlineCount}
          </p>

          <p className="mt-1 text-xs text-gray-400">Virtual classes</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <MapPin size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Physical Sessions
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : physicalCount}
          </p>

          <p className="mt-1 text-xs text-gray-400">On-site activities</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
            <Users size={21} />
          </div>

          <p className="mt-5 text-sm font-medium text-gray-500">
            Students Scheduled
          </p>

          <p className="mt-1 text-2xl font-bold text-gray-900">
            {loading ? "—" : totalStudents.toLocaleString()}
          </p>

          <p className="mt-1 text-xs text-gray-400">Across all sessions</p>
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
                placeholder="Search schedule, course or session type..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1E3A8A] focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowFilters((current) => !current)}
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                showFilters
                  ? "border-[#1E3A8A] bg-blue-50 text-[#1E3A8A]"
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
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-sm font-semibold text-[#B00000] transition hover:bg-red-50"
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
                  Session Type
                </label>

                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
                >
                  {types.map((type) => (
                    <option key={type} value={type}>
                      {type === "All" ? "All Session Types" : type}
                    </option>
                  ))}
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
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
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
                  Delivery Mode
                </label>

                <select
                  value={modeFilter}
                  onChange={(e) => {
                    setModeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm text-gray-700 outline-none focus:border-[#1E3A8A]"
                >
                  <option value="All">All Modes</option>
                  <option value="Online">Online</option>
                  <option value="Physical">Physical</option>
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
              <table className="w-full min-w-[1150px]">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Schedule
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Date & Time
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Students
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Location
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-500">
                      Type
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wide text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {paginatedSchedules.map((schedule) => (
                    <tr
                      key={schedule.id}
                      className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/70"
                    >
                      <td className="px-5 py-4">
                        <div className="max-w-[250px]">
                          <p className="font-semibold text-gray-900">
                            {schedule.title}
                          </p>

                          <p
                            className={`mt-1 text-xs font-medium ${statusClass(
                              schedule.status,
                            )}`}
                          >
                            {schedule.status}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <p className="max-w-[210px] text-sm text-gray-600">
                          {schedule.course}
                        </p>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {formatScheduleDate(schedule.startsAt)}
                          </p>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                            <Clock3 size={13} />
                            {formatScheduleTime(schedule.startsAt)} -{" "}
                            {formatScheduleTime(schedule.endsAt)}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users size={15} className="text-gray-400" />
                          {schedule.students}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-700">
                            {schedule.mode === "Online" ? (
                              <Video size={15} className="text-[#1E3A8A]" />
                            ) : (
                              <MapPin size={15} className="text-[#B00000]" />
                            )}

                            {schedule.location}
                          </div>

                          <p className="mt-1 text-xs text-gray-400">
                            {schedule.mode}
                          </p>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getTypeStyles(
                            schedule.type,
                          )}`}
                        >
                          {schedule.type}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setViewing(schedule)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Eye size={14} />
                            View
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEdit(schedule)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#1E3A8A] px-3 py-2 text-xs font-semibold text-[#1E3A8A] transition hover:bg-blue-50"
                          >
                            <Edit3 size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(schedule.id)}
                            className="inline-flex cursor-pointer items-center justify-center rounded-lg border border-red-100 p-2 text-[#B00000] transition hover:bg-red-50"
                            title="Remove schedule"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {paginatedSchedules.length === 0 && emptyState}
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
            {paginatedSchedules.map((schedule) => (
              <article
                key={schedule.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                        <CalendarDays size={18} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900">
                          {schedule.title}
                        </h3>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {schedule.course}
                        </p>

                        <p
                          className={`mt-0.5 text-xs font-medium ${statusClass(
                            schedule.status,
                          )}`}
                        >
                          {schedule.status}
                        </p>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${getTypeStyles(
                      schedule.type,
                    )}`}
                  >
                    {schedule.type}
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Date
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {formatScheduleDate(schedule.startsAt)}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {formatScheduleDay(schedule.startsAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Time
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <Clock3 size={14} />
                      {formatScheduleTime(schedule.startsAt)} -{" "}
                      {formatScheduleTime(schedule.endsAt)}
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Students
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      <Users size={14} />
                      {schedule.students} students
                    </p>
                  </div>

                  <div className="rounded-xl border border-gray-100 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Delivery
                    </p>

                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                      {schedule.mode === "Online" ? (
                        <Video size={14} className="text-[#1E3A8A]" />
                      ) : (
                        <MapPin size={14} className="text-[#B00000]" />
                      )}

                      {schedule.mode}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {schedule.location}
                    </p>
                  </div>
                </div>

                {schedule.description && (
                  <div className="mt-4 rounded-xl bg-gray-50 p-3">
                    <p className="text-[11px] font-medium text-gray-400">
                      Session Description
                    </p>

                    <p className="mt-1 text-xs leading-5 text-gray-600">
                      {schedule.description}
                    </p>
                  </div>
                )}

                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => setViewing(schedule)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    <Eye size={15} />
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => handleEdit(schedule)}
                    className="inline-flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#1E3A8A] px-4 py-3 text-xs font-semibold text-[#1E3A8A] transition hover:bg-blue-50"
                  >
                    <Edit3 size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(schedule.id)}
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-3 text-xs font-semibold text-[#B00000] transition hover:bg-red-50"
                  >
                    <Trash2 size={15} />
                    Remove
                  </button>
                </div>
              </article>
            ))}

            {paginatedSchedules.length === 0 && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                {emptyState}
              </div>
            )}
          </>
        )}
      </section>

      {/* PAGINATION */}
      {!loading && filteredSchedules.length > 0 && (
        <section className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-700">
              {(currentPage - 1) * itemsPerPage + 1}
            </span>{" "}
            to{" "}
            <span className="font-semibold text-gray-700">
              {Math.min(currentPage * itemsPerPage, filteredSchedules.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-700">
              {filteredSchedules.length}
            </span>{" "}
            schedules
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

            <div className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-[#1E3A8A] px-3 text-xs font-bold text-white">
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

      {/* VIEW MODAL */}
      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close"
            onClick={() => setViewing(null)}
            className="absolute inset-0 cursor-pointer bg-black/50"
          />

          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold ${getTypeStyles(
                    viewing.type,
                  )}`}
                >
                  {viewing.type}
                </span>

                <h2 className="mt-3 text-lg font-bold text-gray-900">
                  {viewing.title}
                </h2>

                <p className="mt-1 text-sm text-gray-500">{viewing.course}</p>

                <p
                  className={`mt-1 text-xs font-semibold ${statusClass(
                    viewing.status,
                  )}`}
                >
                  {viewing.status}
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

            <div className="mt-5 space-y-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[11px] font-medium text-gray-400">
                  Date & Time
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {formatScheduleDay(viewing.startsAt)},{" "}
                  {formatScheduleDate(viewing.startsAt)}
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock3 size={13} />
                  {formatScheduleTime(viewing.startsAt)} -{" "}
                  {formatScheduleTime(viewing.endsAt)} (WAT)
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[11px] font-medium text-gray-400">
                  {viewing.mode} session
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  {viewing.mode === "Online" ? (
                    <Video size={15} className="text-[#1E3A8A]" />
                  ) : (
                    <MapPin size={15} className="text-[#B00000]" />
                  )}
                  {viewing.location}
                </p>

                {viewing.meetingLink && (
                  <a
                    href={viewing.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 break-all text-xs font-semibold text-[#1E3A8A] hover:underline"
                  >
                    <ExternalLink size={13} className="shrink-0" />
                    {viewing.meetingLink}
                  </a>
                )}
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-[11px] font-medium text-gray-400">
                  Students
                </p>

                <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-gray-800">
                  <Users size={14} />
                  {viewing.students} enrolled in this course
                </p>
              </div>

              {viewing.description && (
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-[11px] font-medium text-gray-400">
                    Description
                  </p>

                  <p className="mt-1 whitespace-pre-line text-xs leading-5 text-gray-600">
                    {viewing.description}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="cursor-pointer rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Close
              </button>

              <button
                type="button"
                onClick={() => handleEdit(viewing)}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
              >
                <Edit3 size={16} />
                Edit Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
