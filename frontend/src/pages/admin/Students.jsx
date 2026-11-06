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
  GraduationCap,
  BookOpen,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchStudents, removeStudent } from "../../store/adminStudentSlice";

const Students = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { items: students, listError } = useSelector(
    (state) => state.adminStudents,
  );

  console.log("STUDENTS PROFILE", students);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    dispatch(fetchStudents());
  }, [dispatch]);

  useEffect(() => {
    if (listError) {
      toast.error(listError);
    }
  }, [listError]);

  // --------------------------------------------------
  // SUMMARY STATISTICS
  // --------------------------------------------------

  const totalStudents = students.length;

  const activeStudents = students.filter(
    (student) => student.status === "Active",
  ).length;

  const pendingStudents = students.filter(
    (student) => student.status === "Pending",
  ).length;

  const inactiveStudents = students.filter(
    (student) => student.status === "Inactive",
  ).length;

  // --------------------------------------------------
  // FILTER STUDENTS
  // --------------------------------------------------

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const search = searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        student.name.toLowerCase().includes(search) ||
        student.email.toLowerCase().includes(search) ||
        student.phone.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "All" || student.status === statusFilter;

      const matchesCourse =
        courseFilter === "All" ||
        (courseFilter === "1-3" &&
          student.courses >= 1 &&
          student.courses <= 3) ||
        (courseFilter === "4-6" &&
          student.courses >= 4 &&
          student.courses <= 6) ||
        (courseFilter === "7+" && student.courses >= 7);

      return matchesSearch && matchesStatus && matchesCourse;
    });
  }, [students, searchTerm, statusFilter, courseFilter]);

  // --------------------------------------------------
  // AVATAR INITIALS
  // --------------------------------------------------

  const getInitials = (name) => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  // --------------------------------------------------
  // STATUS BADGE
  // --------------------------------------------------

  const getStatusBadge = (status) => {
    if (status === "Active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={13} />
          Active
        </span>
      );
    }

    if (status === "Pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-2.5 py-1 text-xs font-semibold text-yellow-700">
          <Clock3 size={13} />
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
        <UserX size={13} />
        Inactive
      </span>
    );
  };

  // --------------------------------------------------
  // ACTIONS
  // --------------------------------------------------

  const handleViewStudent = (student) => {
    setOpenMenu(null);

    navigate(`/dashboard/admin/students/${student.id}`);
  };

  const handleEditStudent = (student) => {
    setOpenMenu(null);

    navigate(`/dashboard/admin/students/${student.id}/edit`);
  };

  const handleDeleteStudent = (student) => {
    setOpenMenu(null);

    const confirmed = window.confirm(
      `Are you sure you want to remove ${student.name}?`,
    );

    if (!confirmed) return;

    dispatch(removeStudent(student.id))
      .unwrap()
      .then(() => {
        toast.success(`${student.name} has been removed.`);
      })
      .catch((error) => {
        toast.error(error || "Unable to remove this student.");
      });
  };

  // const handleAddStudent = () => {
  //   toast.info("Student registration will be connected to the backend later.");
  // };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setCourseFilter("All");
  };

  const hasFilters =
    searchTerm || statusFilter !== "All" || courseFilter !== "All";

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* ==================================================
          PAGE HEADER
      =================================================== */}

      <section className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div>
          <p className="text-sm font-medium text-primary">Student Management</p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Students
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Manage student accounts, enrollment and learning activity.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/students/create")}
          className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] lg:w-auto"
        >
          <UserPlus size={18} />
          Create Student
        </button>
      </section>

      {/* ==================================================
          STATISTICS
      =================================================== */}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total Students
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {totalStudents.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">Registered students</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-secondary">
              <GraduationCap size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Active Students
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {activeStudents.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-green-600">Currently active</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Pending
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {pendingStudents.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-yellow-600">
                Awaiting activation
              </p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Clock3 size={21} />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Inactive
              </p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {inactiveStudents.toLocaleString()}
              </p>

              <p className="mt-1 text-xs text-gray-500">Not recently active</p>
            </div>

            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              <UserX size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================
          SEARCH & FILTERS
      =================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div className="relative flex-1">
            <Search
              size={19}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              placeholder="Search students by name, email or phone..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>

          <div className="relative">
            <Filter
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-9 text-sm text-gray-600 outline-none transition focus:border-[#B00000] sm:w-44"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <BookOpen
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-9 text-sm text-gray-600 outline-none transition focus:border-[#B00000] sm:w-44"
            >
              <option value="All">All Courses</option>
              <option value="1-3">1 - 3 Courses</option>
              <option value="4-6">4 - 6 Courses</option>
              <option value="7+">7+ Courses</option>
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-[#B00000] hover:text-[#B00000]"
            >
              <X size={16} />
              Clear
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filteredStudents.length}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {students.length}
            </span>{" "}
            students
          </p>

          {hasFilters && (
            <span className="text-xs font-medium text-[#B00000]">
              Filters applied
            </span>
          )}
        </div>
      </section>

      {/* ==================================================
          STUDENTS TABLE
      =================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">All Students</h2>

              <p className="mt-1 text-xs text-gray-500">
                Manage registered students on the platform.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full min-w-[1000px] text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/70 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-4 font-semibold">Student</th>

                <th className="px-5 py-4 font-semibold">Phone</th>

                <th className="px-5 py-4 font-semibold">Status</th>

                <th className="px-5 py-4 font-semibold">Courses</th>

                <th className="px-5 py-4 font-semibold">Joined</th>

                <th className="px-5 py-4 font-semibold">Last Active</th>

                <th className="px-5 py-4 text-right font-semibold">Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/70"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#1E3A8A]">
                          {getInitials(student.name)}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-gray-900">
                            {student.name}
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {student.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-600">
                      {student.phone}
                    </td>

                    <td className="px-5 py-4">
                      {getStatusBadge(student.status)}
                    </td>

                    <td className="px-5 py-4">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {student.courses} enrolled
                        </p>

                        <p className="text-xs text-gray-500">
                          {student.completed} completed
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {student.joined}
                    </td>

                    <td className="px-5 py-4 text-sm text-gray-500">
                      {student.lastActive}
                    </td>

                    <td className="relative px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === student.id ? null : student.id,
                          )
                        }
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                      >
                        <MoreVertical size={18} />
                      </button>

                      {openMenu === student.id && (
                        <div className="absolute right-5 top-12 z-20 w-44 rounded-xl border border-gray-100 bg-white p-1.5 text-left shadow-lg">
                          <button
                            type="button"
                            onClick={() => handleViewStudent(student)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
                          >
                            <Eye size={16} />
                            View Student
                          </button>

                          <button
                            type="button"
                            onClick={() => handleEditStudent(student)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 transition hover:bg-gray-50"
                          >
                            <Pencil size={16} />
                            Edit Student
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student)}
                            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 transition hover:bg-red-50"
                          >
                            <Trash2 size={16} />
                            Remove Student
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="px-5 py-16 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                      <Search size={24} />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-800">
                      No students found
                    </h3>

                    <p className="mt-1 text-xs text-gray-500">
                      Try changing your search or filters.
                    </p>

                    {hasFilters && (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="mt-4 text-xs font-semibold text-[#B00000] hover:underline"
                      >
                        Clear filters
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="divide-y divide-gray-100 lg:hidden">
          {filteredStudents.length > 0 ? (
            filteredStudents.map((student) => (
              <div key={student.id} className="p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-[#1E3A8A]">
                    {getInitials(student.name)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold text-gray-900">
                          {student.name}
                        </h3>

                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {student.email}
                        </p>
                      </div>

                      <div className="relative shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenMenu(
                              openMenu === student.id ? null : student.id,
                            )
                          }
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                        >
                          <MoreVertical size={17} />
                        </button>

                        {openMenu === student.id && (
                          <div className="absolute right-0 top-9 z-20 w-44 rounded-xl border border-gray-100 bg-white p-1.5 shadow-lg">
                            <button
                              type="button"
                              onClick={() => handleViewStudent(student)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <Eye size={16} />
                              View Student
                            </button>

                            <button
                              type="button"
                              onClick={() => handleEditStudent(student)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                            >
                              <Pencil size={16} />
                              Edit Student
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteStudent(student)}
                              className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                              Remove Student
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">{getStatusBadge(student.status)}</div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Courses
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800">
                      {student.courses}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Completed
                    </p>

                    <p className="mt-1 text-sm font-bold text-gray-800">
                      {student.completed}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Joined
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {student.joined}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-gray-400">
                      Last Active
                    </p>

                    <p className="mt-1 text-xs font-semibold text-gray-700">
                      {student.lastActive}
                    </p>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-gray-100 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-gray-400">
                    Phone
                  </p>

                  <p className="mt-1 text-xs font-medium text-gray-700">
                    {student.phone}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="px-5 py-16 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <Search size={24} />
              </div>

              <h3 className="mt-4 text-sm font-semibold text-gray-800">
                No students found
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Try changing your search or filters.
              </p>

              {hasFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 text-xs font-semibold text-[#B00000] hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {filteredStudents.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">
              Showing <span className="font-semibold text-gray-700">1</span> -{" "}
              <span className="font-semibold text-gray-700">
                {filteredStudents.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-700">
                {students.length}
              </span>
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-[#B00000] text-sm font-semibold text-white"
              >
                1
              </button>

              <button
                type="button"
                disabled
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-300"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Students;
