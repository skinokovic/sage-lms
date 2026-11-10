import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  UserPlus,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock3,
  UserX,
  BookOpen,
  Users,
  Star,
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  fetchInstructors,
  deleteInstructor,
} from "../../store/instructorSlice";

const Instructors = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    instructors = [],
    status,
    actionStatus,
    error,
  } = useSelector((state) => state.instructors);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");

  // =========================================================
  // LOAD INSTRUCTORS FROM DATABASE
  // =========================================================
  useEffect(() => {
    dispatch(fetchInstructors());
  }, [dispatch]);

  console.log("INSTRUCTOR", instructors);

  // =========================================================
  // SHOW API ERROR
  // =========================================================
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // =========================================================
  // STATISTICS
  // =========================================================
  const stats = useMemo(() => {
    return {
      total: instructors.length,

      active: instructors.filter((instructor) => instructor.status === "Active")
        .length,

      pending: instructors.filter(
        (instructor) => instructor.status === "Pending",
      ).length,

      inactive: instructors.filter(
        (instructor) => instructor.status === "Inactive",
      ).length,

      totalStudents: instructors.reduce(
        (total, instructor) => total + Number(instructor.students || 0),
        0,
      ),
    };
  }, [instructors]);

  // =========================================================
  // SEARCH + FILTER
  // =========================================================
  const filteredInstructors = useMemo(() => {
    return instructors.filter((instructor) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        instructor.name?.toLowerCase().includes(searchValue) ||
        instructor.email?.toLowerCase().includes(searchValue) ||
        instructor.phone?.toLowerCase().includes(searchValue) ||
        instructor.specialization?.toLowerCase().includes(searchValue);

      const courses = Number(instructor.courses || 0);

      const matchesStatus =
        statusFilter === "All" || instructor.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" ||
        (courseFilter === "1-2" && courses >= 1 && courses <= 2) ||
        (courseFilter === "3-4" && courses >= 3 && courses <= 4) ||
        (courseFilter === "5+" && courses >= 5);

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [instructors, search, statusFilter, courseFilter]);

  // =========================================================
  // CLEAR FILTERS
  // =========================================================
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCourseFilter("All");
  };

  const hasFilters =
    search.trim() !== "" || statusFilter !== "All" || courseFilter !== "All";

  // =========================================================
  // VIEW
  // =========================================================
  const handleView = (instructor) => {
    navigate(`/dashboard/admin/instructors/${instructor.id}`);
  };

  // =========================================================
  // EDIT
  // =========================================================
  const handleEdit = (instructor) => {
    navigate(`/dashboard/admin/instructors/${instructor.id}/edit`);
  };

  // =========================================================
  // DELETE
  // =========================================================
  const handleDelete = async (instructor) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${instructor.name}? This will also remove the instructor account.`,
    );

    if (!confirmed) return;

    try {
      await dispatch(deleteInstructor(instructor.id)).unwrap();

      toast.success(`${instructor.name} removed successfully.`);
    } catch (error) {
      toast.error(error || "Failed to remove instructor.");
    }
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================
  const getStatusStyle = (status) => {
    switch (status) {
      case "Active":
        return {
          badge: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle2,
        };

      case "Pending":
        return {
          badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: Clock3,
        };

      case "Inactive":
        return {
          badge: "bg-gray-100 text-gray-600 border-gray-200",
          icon: UserX,
        };

      default:
        return {
          badge: "bg-gray-100 text-gray-600 border-gray-200",
          icon: UserX,
        };
    }
  };

  // =========================================================
  // INITIALS
  // =========================================================
  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // =========================================================
  // LOADING
  // =========================================================
  if (status === "loading" && instructors.length === 0) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <LoaderCircle size={36} className="animate-spin text-[#B00000]" />

          <p className="text-sm">Loading instructors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Instructors
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage instructors, courses, and teaching activities.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/instructors/create")}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          <UserPlus size={18} />
          Create Instructor
        </button>
      </div>

      {/* =====================================================
          STATS
      ====================================================== */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* TOTAL */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Instructors</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.total}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-[#1E3A8A]">
              <GraduationCap size={22} />
            </div>
          </div>
        </div>

        {/* ACTIVE */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.active}
              </h2>
            </div>

            <div className="rounded-lg bg-green-50 p-3 text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* PENDING */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.pending}
              </h2>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Clock3 size={22} />
            </div>
          </div>
        </div>

        {/* INACTIVE */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inactive</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.inactive}
              </h2>
            </div>

            <div className="rounded-lg bg-gray-100 p-3 text-gray-600">
              <UserX size={22} />
            </div>
          </div>
        </div>

        {/* STUDENTS */}
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Students Taught</p>

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

      {/* =====================================================
          FILTERS
      ====================================================== */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          {/* SEARCH */}
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search instructors by name, email, phone or specialization..."
              className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>

          {/* STATUS */}
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
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* COURSE FILTER */}
          <div>
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] sm:w-44"
            >
              <option value="All">All Courses</option>
              <option value="1-2">1 - 2 Courses</option>
              <option value="3-4">3 - 4 Courses</option>
              <option value="5+">5+ Courses</option>
            </select>
          </div>

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

      {/* =====================================================
          RESULT COUNT
      ====================================================== */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing{" "}
          <span className="font-semibold text-gray-900">
            {filteredInstructors.length}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-gray-900">
            {instructors.length}
          </span>{" "}
          instructors
        </p>
      </div>

      {/* =====================================================
          DESKTOP TABLE
      ====================================================== */}
      <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Instructor
                </th>

                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Specialization
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Courses
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Students
                </th>

                <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Rating
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
              {filteredInstructors.map((instructor) => {
                const statusStyle = getStatusStyle(instructor.status);

                const StatusIcon = statusStyle.icon;

                return (
                  <tr
                    key={instructor.id}
                    className="transition hover:bg-gray-50"
                  >
                    {/* INSTRUCTOR */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {instructor.avatarUrl ? (
                          <img
                            src={instructor.avatarUrl}
                            alt={instructor.name}
                            className="h-11 w-11 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-sm font-bold text-[#1E3A8A]">
                            {getInitials(instructor.name)}
                          </div>
                        )}

                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900">
                            {instructor.name}
                          </p>

                          <p className="text-sm text-gray-500">
                            {instructor.email}
                          </p>

                          <p className="text-xs text-gray-400">
                            {instructor.phone || "No phone"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* SPECIALIZATION */}
                    <td className="px-6 py-4">
                      <p className="max-w-[220px] text-sm font-medium text-gray-700">
                        {instructor.specialization || "Not specified"}
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        {instructor.experience || "Experience not specified"}
                      </p>
                    </td>

                    {/* COURSES */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <BookOpen size={16} className="text-[#1E3A8A]" />

                        {instructor.courses || 0}
                      </div>
                    </td>

                    {/* STUDENTS */}
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                        <Users size={16} className="text-[#B00000]" />

                        {instructor.students || 0}
                      </div>
                    </td>

                    {/* RATING */}
                    <td className="px-6 py-4 text-center">
                      {Number(instructor.rating) > 0 ? (
                        <div className="inline-flex items-center gap-1 text-sm font-semibold text-gray-700">
                          <Star
                            size={16}
                            className="fill-yellow-400 text-yellow-400"
                          />

                          {instructor.rating}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No rating</span>
                      )}
                    </td>

                    {/* STATUS */}
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}
                      >
                        <StatusIcon size={14} />
                        {instructor.status}
                      </span>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {/* VIEW */}
                        <button
                          type="button"
                          onClick={() => handleView(instructor)}
                          title="View Instructor"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-[#1E3A8A]"
                        >
                          <Eye size={18} />
                        </button>

                        {/* EDIT */}
                        <button
                          type="button"
                          onClick={() => handleEdit(instructor)}
                          title="Edit Instructor"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-yellow-50 hover:text-yellow-600"
                        >
                          <Pencil size={18} />
                        </button>

                        {/* DELETE */}
                        <button
                          type="button"
                          disabled={actionStatus === "loading"}
                          onClick={() => handleDelete(instructor)}
                          title="Remove Instructor"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Trash2 size={18} />
                        </button>

                        {/* MORE */}
                        <button
                          type="button"
                          title="More Options"
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
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

      {/* =====================================================
          MOBILE CARDS
      ====================================================== */}
      <div className="grid gap-4 md:hidden">
        {filteredInstructors.map((instructor) => {
          const statusStyle = getStatusStyle(instructor.status);

          const StatusIcon = statusStyle.icon;

          return (
            <div
              key={instructor.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              {/* HEADER */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {instructor.avatarUrl ? (
                    <img
                      src={instructor.avatarUrl}
                      alt={instructor.name}
                      className="h-12 w-12 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-sm font-bold text-[#1E3A8A]">
                      {getInitials(instructor.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">
                      {instructor.name}
                    </h3>

                    <p className="truncate text-sm text-gray-500">
                      {instructor.email}
                    </p>

                    <p className="text-xs text-gray-400">
                      {instructor.phone || "No phone"}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100"
                >
                  <MoreVertical size={18} />
                </button>
              </div>

              {/* STATUS */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}
                >
                  <StatusIcon size={14} />
                  {instructor.status}
                </span>
              </div>

              {/* SPECIALIZATION */}
              <div className="mt-4 rounded-lg bg-gray-50 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                  Specialization
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {instructor.specialization || "Not specified"}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {instructor.experience || "Experience not specified"}
                </p>
              </div>

              {/* STATS */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-gray-100 p-3 text-center">
                  <BookOpen size={17} className="mx-auto text-[#1E3A8A]" />

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {instructor.courses || 0}
                  </p>

                  <p className="text-xs text-gray-500">Courses</p>
                </div>

                <div className="rounded-lg border border-gray-100 p-3 text-center">
                  <Users size={17} className="mx-auto text-[#B00000]" />

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {instructor.students || 0}
                  </p>

                  <p className="text-xs text-gray-500">Students</p>
                </div>

                <div className="rounded-lg border border-gray-100 p-3 text-center">
                  <Star
                    className="mx-auto fill-yellow-400 text-yellow-400"
                    size={17}
                  />

                  <p className="mt-1 text-lg font-bold text-gray-900">
                    {instructor.rating || "—"}
                  </p>

                  <p className="text-xs text-gray-500">Rating</p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="mt-4 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleView(instructor)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <Eye size={16} />
                  View
                </button>

                <button
                  type="button"
                  onClick={() => handleEdit(instructor)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                >
                  <Pencil size={16} />
                  Edit
                </button>

                <button
                  type="button"
                  disabled={actionStatus === "loading"}
                  onClick={() => handleDelete(instructor)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* =====================================================
          EMPTY STATE
      ====================================================== */}
      {filteredInstructors.length === 0 && status !== "loading" && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
            <GraduationCap size={28} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No instructors found
          </h3>

          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
            {instructors.length === 0
              ? "There are currently no instructors in the database."
              : "Try changing your search or filters to find the instructor you are looking for."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B00000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f0000]"
            >
              <X size={16} />
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* =====================================================
          PAGINATION
      ====================================================== */}
      {filteredInstructors.length > 0 && (
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
    </div>
  );
};

export default Instructors;
