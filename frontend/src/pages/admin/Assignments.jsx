import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

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
  ClipboardList,
  Users,
  FileCheck2,
  AlertCircle,
  CalendarDays,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  fetchAssignments,
  deleteAssignment,
} from "../../store/assignmentSlice";

/* ============================================================
   HELPER FUNCTIONS
============================================================ */

/*
  The backend returns:

  course: {
    id,
    title,
    category,
    status
  }

  instructor: {
    id,
    name,
    email
  }

  These helpers make sure the UI always receives strings.
*/

const getCourseName = (course) => {
  if (!course) return "No course";

  if (typeof course === "string") {
    return course;
  }

  return course.title || course.name || "No course";
};

const getCourseId = (course) => {
  if (!course) return "";

  if (typeof course === "string") {
    return course;
  }

  return course.id || course._id || "";
};

const getInstructorName = (instructor) => {
  if (!instructor) return "No instructor";

  if (typeof instructor === "string") {
    return instructor;
  }

  return instructor.name || instructor.email || "No instructor";
};

const getInstructorId = (instructor) => {
  if (!instructor) return "";

  if (typeof instructor === "string") {
    return instructor;
  }

  return instructor.id || instructor._id || "";
};

const getNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const formatDueDate = (date) => {
  if (!date) {
    return "No due date";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(date);
  }

  return parsedDate.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

/* ============================================================
   NORMALIZE ASSIGNMENT
============================================================ */

/*
  This is the most important part of the fix.

  It converts the database response into a safe structure
  for the UI.

  Example:

  Backend:
  course: {
    id: "...",
    title: "React Development"
  }

  UI:
  courseName: "React Development"
*/

const normalizeAssignment = (assignment) => {
  if (!assignment) {
    return null;
  }

  const submissions = getNumber(assignment.submissions);

  const graded = getNumber(assignment.graded);

  const students = getNumber(assignment.students);

  const courseName = getCourseName(assignment.course);

  const courseId = getCourseId(assignment.course);

  const instructorName = getInstructorName(assignment.instructor);

  const instructorId = getInstructorId(assignment.instructor);

  return {
    ...assignment,

    id: assignment.id || assignment._id,

    title: assignment.title || "Untitled Assignment",

    courseName,

    courseId,

    instructorName,

    instructorId,

    students,

    submissions,

    graded,

    dueDate: assignment.dueDate || null,

    status: assignment.status || "Draft",

    points: getNumber(assignment.points),

    type: assignment.type || "Assignment",
  };
};

/* ============================================================
   COMPONENT
============================================================ */

const Assignments = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /* ----------------------------- REDUX ----------------------------- */

  const {
    assignments: assignmentData,
    status,
    actionStatus,
    error,
  } = useSelector(
    (state) =>
      state.assignments || {
        assignments: [],
        status: "idle",
        actionStatus: "idle",
        error: null,
      },
  );

  /* ----------------------------- LOCAL STATE ----------------------------- */

  const [search, setSearch] = useState("");

  const [statusFilter, setStatusFilter] = useState("All");

  const [courseFilter, setCourseFilter] = useState("All");

  const [submissionFilter, setSubmissionFilter] = useState("All");

  /* ============================================================
     LOAD ASSIGNMENTS
  ============================================================ */

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchAssignments());
    }
  }, [dispatch, status]);

  /* ============================================================
     NORMALIZE DATABASE DATA
  ============================================================ */

  const assignments = useMemo(() => {
    if (!Array.isArray(assignmentData)) {
      return [];
    }

    return assignmentData.map(normalizeAssignment).filter(Boolean);
  }, [assignmentData]);

  /* ============================================================
     ERROR TOAST
  ============================================================ */

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /* ============================================================
     STATS
  ============================================================ */

  const stats = useMemo(() => {
    const totalSubmissions = assignments.reduce(
      (total, assignment) => total + getNumber(assignment?.submissions),
      0,
    );

    const totalGraded = assignments.reduce(
      (total, assignment) => total + getNumber(assignment?.graded),
      0,
    );

    const pendingGrading = Math.max(totalSubmissions - totalGraded, 0);

    const published = assignments.filter(
      (assignment) => assignment.status === "Published",
    ).length;

    const draft = assignments.filter(
      (assignment) => assignment.status === "Draft",
    ).length;

    const closed = assignments.filter(
      (assignment) =>
        assignment.status === "Closed" || assignment.status === "Archived",
    ).length;

    return {
      total: assignments.length,

      published,

      draft,

      closed,

      totalSubmissions,

      pendingGrading,
    };
  }, [assignments]);

  /* ============================================================
     COURSE OPTIONS
  ============================================================ */

  const courses = useMemo(() => {
    const courseMap = new Map();

    assignments.forEach((assignment) => {
      if (assignment.courseId && assignment.courseName) {
        courseMap.set(assignment.courseId, assignment.courseName);
      }
    });

    return Array.from(courseMap.entries()).map(([id, title]) => ({
      id,
      title,
    }));
  }, [assignments]);

  /* ============================================================
     FILTER ASSIGNMENTS
  ============================================================ */

  const filteredAssignments = useMemo(() => {
    const searchValue = search.toLowerCase().trim();

    return assignments.filter((assignment) => {
      const title = String(assignment.title || "").toLowerCase();

      const course = String(assignment.courseName || "").toLowerCase();

      const instructor = String(assignment.instructorName || "").toLowerCase();

      const type = String(assignment.type || "").toLowerCase();

      const matchesSearch =
        !searchValue ||
        title.includes(searchValue) ||
        course.includes(searchValue) ||
        instructor.includes(searchValue) ||
        type.includes(searchValue);

      const matchesStatus =
        statusFilter === "All" ||
        assignment.status === statusFilter ||
        (statusFilter === "Closed" && assignment.status === "Archived");

      const matchesCourse =
        courseFilter === "All" || assignment.courseId === courseFilter;

      const submissions = getNumber(assignment.submissions);

      const graded = getNumber(assignment.graded);

      const matchesSubmission =
        submissionFilter === "All" ||
        (submissionFilter === "Submitted" && submissions > 0) ||
        (submissionFilter === "Not Submitted" && submissions === 0) ||
        (submissionFilter === "Fully Graded" &&
          submissions > 0 &&
          graded === submissions) ||
        (submissionFilter === "Needs Grading" && submissions > graded);

      return (
        matchesSearch && matchesStatus && matchesCourse && matchesSubmission
      );
    });
  }, [assignments, search, statusFilter, courseFilter, submissionFilter]);

  /* ============================================================
     FILTER STATE
  ============================================================ */

  const hasFilters =
    search.trim() !== "" ||
    statusFilter !== "All" ||
    courseFilter !== "All" ||
    submissionFilter !== "All";

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("All");
    setCourseFilter("All");
    setSubmissionFilter("All");
  };

  /* ============================================================
     ACTIONS
  ============================================================ */

  const handleAddAssignment = () => {
    navigate("/dashboard/admin/assignments/create");
  };

  const handleView = (assignment) => {
    if (!assignment?.id) {
      toast.error("Assignment ID is missing.");

      return;
    }

    /*
      Keep this route ready for the
      assignment details page.
    */

    navigate(`/dashboard/admin/assignments/${assignment.id}`);
  };

  const handleEdit = (assignment) => {
    if (!assignment?.id) {
      toast.error("Assignment ID is missing.");

      return;
    }

    navigate(`/dashboard/admin/assignments/${assignment.id}/edit`);
  };

  const handleDelete = async (assignment) => {
    if (!assignment?.id) {
      toast.error("Assignment ID is missing.");

      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete "${assignment.title}"? This will also remove its submissions.`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await dispatch(deleteAssignment(assignment.id)).unwrap();

      toast.success("Assignment deleted successfully.");

      /*
        The Redux slice removes the assignment
        from the local state after successful
        deletion.
      */
    } catch (deleteError) {
      toast.error(deleteError || "Failed to delete assignment.");
    }
  };

  const handleRefresh = () => {
    dispatch(fetchAssignments());
  };

  /* ============================================================
     STATUS STYLE
  ============================================================ */

  const getStatusStyle = (assignmentStatus) => {
    switch (assignmentStatus) {
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

      case "Closed":
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

  /* ============================================================
     SUBMISSION STATUS
  ============================================================ */

  const getSubmissionStatus = (assignment) => {
    const submissions = getNumber(assignment?.submissions);

    const graded = getNumber(assignment?.graded);

    if (submissions === 0) {
      return {
        label: "No submissions",
        className: "text-gray-400",
      };
    }

    if (graded < submissions) {
      return {
        label: `${submissions - graded} to grade`,
        className: "text-orange-600",
      };
    }

    return {
      label: "Fully graded",
      className: "text-green-600",
    };
  };

  /* ============================================================
     SUBMISSION PERCENTAGE
  ============================================================ */

  const getSubmissionPercentage = (assignment) => {
    const students = getNumber(assignment?.students);

    const submissions = getNumber(assignment?.submissions);

    /*
      The current Assignment API does not
      return enrolled student count.

      Therefore we don't invent a percentage.
    */

    if (students <= 0) {
      return 0;
    }

    return Math.min(Math.round((submissions / students) * 100), 100);
  };

  /* ============================================================
     GRADING PERCENTAGE
  ============================================================ */

  const getGradingPercentage = (assignment) => {
    const submissions = getNumber(assignment?.submissions);

    const graded = getNumber(assignment?.graded);

    if (submissions <= 0) {
      return 0;
    }

    return Math.min(Math.round((graded / submissions) * 100), 100);
  };

  /* ============================================================
     LOADING STATE
  ============================================================ */

  const isLoading = status === "loading";

  /* ============================================================
     RENDER
  ============================================================ */

  return (
    <div className="space-y-6">
      {/* ======================================================
          PAGE HEADER
      ====================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Assignments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Manage assignments, submissions, grading, and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh assignments"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={17} className={isLoading ? "animate-spin" : ""} />

            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleAddAssignment}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            <Plus size={18} />
            Add Assignment
          </button>
        </div>
      </div>

      {/* ======================================================
          STATS
      ====================================================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {/* TOTAL */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Assignments</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.total}
              </h2>
            </div>

            <div className="rounded-lg bg-blue-50 p-3 text-[#1E3A8A]">
              <ClipboardList size={22} />
            </div>
          </div>
        </div>

        {/* PUBLISHED */}

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

        {/* DRAFT */}

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

        {/* SUBMISSIONS */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.totalSubmissions.toLocaleString()}
              </h2>
            </div>

            <div className="rounded-lg bg-purple-50 p-3 text-purple-600">
              <FileCheck2 size={22} />
            </div>
          </div>
        </div>

        {/* NEEDS GRADING */}

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Needs Grading</p>

              <h2 className="mt-1 text-2xl font-bold text-gray-900">
                {stats.pendingGrading.toLocaleString()}
              </h2>
            </div>

            <div className="rounded-lg bg-orange-50 p-3 text-orange-600">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================
          FILTERS
      ====================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center">
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
              placeholder="Search assignments, courses, instructors..."
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

              <option value="Published">Published</option>

              <option value="Draft">Draft</option>

              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* COURSE */}

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] sm:w-64"
          >
            <option value="All">All Courses</option>

            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.title}
              </option>
            ))}
          </select>

          {/* SUBMISSION */}

          <select
            value={submissionFilter}
            onChange={(e) => setSubmissionFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] sm:w-48"
          >
            <option value="All">All Submissions</option>

            <option value="Submitted">Has Submissions</option>

            <option value="Not Submitted">No Submissions</option>

            <option value="Fully Graded">Fully Graded</option>

            <option value="Needs Grading">Needs Grading</option>
          </select>

          {/* CLEAR */}

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

      {/* ======================================================
          LOADING
      ====================================================== */}

      {isLoading && (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 size={32} className="animate-spin text-[#B00000]" />

            <p className="text-sm font-medium text-gray-500">
              Loading assignments...
            </p>
          </div>
        </div>
      )}

      {/* ======================================================
          ERROR
      ====================================================== */}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle size={32} className="mx-auto text-red-500" />

          <h3 className="mt-3 font-semibold text-red-800">
            Unable to load assignments
          </h3>

          <p className="mt-1 text-sm text-red-600">{error}</p>

          <button
            type="button"
            onClick={handleRefresh}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B00000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#8f0000]"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      )}

      {/* ======================================================
          CONTENT
      ====================================================== */}

      {!isLoading && !error && (
        <>
          {/* RESULT COUNT */}

          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Showing{" "}
              <span className="font-semibold text-gray-900">
                {filteredAssignments.length}
              </span>{" "}
              of{" "}
              <span className="font-semibold text-gray-900">
                {assignments.length}
              </span>{" "}
              assignments
            </p>
          </div>

          {/* ==================================================
                DESKTOP TABLE
            ================================================== */}

          {filteredAssignments.length > 0 && (
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1250px]">
                  <thead className="border-b border-gray-200 bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Assignment
                      </th>

                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Course / Instructor
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Students
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Submissions
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Grading
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Due Date
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
                    {filteredAssignments.map((assignment) => {
                      const statusStyle = getStatusStyle(assignment.status);

                      const StatusIcon = statusStyle.icon;

                      const submissionStatus = getSubmissionStatus(assignment);

                      const submissionPercentage =
                        getSubmissionPercentage(assignment);

                      const gradingPercentage =
                        getGradingPercentage(assignment);

                      return (
                        <tr
                          key={assignment.id}
                          className="transition hover:bg-gray-50"
                        >
                          {/* ASSIGNMENT */}

                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                                <ClipboardList size={21} />
                              </div>

                              <div className="min-w-0">
                                <p className="max-w-[280px] font-semibold text-gray-900">
                                  {assignment.title}
                                </p>

                                <div className="mt-1 flex items-center gap-2">
                                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600">
                                    {assignment.type}
                                  </span>

                                  <span className="text-xs text-gray-400">
                                    {assignment.points} points
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* COURSE / INSTRUCTOR */}

                          <td className="px-6 py-4">
                            <p className="max-w-[230px] text-sm font-medium text-gray-700">
                              {assignment.courseName}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {assignment.instructorName}
                            </p>
                          </td>

                          {/* STUDENTS */}

                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700">
                              <Users size={16} className="text-[#1E3A8A]" />

                              {assignment.students > 0
                                ? assignment.students
                                : "—"}
                            </div>
                          </td>

                          {/* SUBMISSIONS */}

                          <td className="px-6 py-4">
                            <div className="min-w-[130px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-gray-700">
                                  {assignment.submissions}
                                </span>

                                {assignment.students > 0 ? (
                                  <span className="text-gray-400">
                                    {submissionPercentage}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-[#1E3A8A]"
                                  style={{
                                    width: `${submissionPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* GRADING */}

                          <td className="px-6 py-4">
                            <div className="min-w-[130px]">
                              <div className="flex items-center justify-between text-xs">
                                <span
                                  className={`font-semibold ${submissionStatus.className}`}
                                >
                                  {submissionStatus.label}
                                </span>

                                <span className="text-gray-400">
                                  {gradingPercentage}%
                                </span>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-green-500"
                                  style={{
                                    width: `${gradingPercentage}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* DUE DATE */}

                          <td className="px-6 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-700">
                              <CalendarDays
                                size={16}
                                className="text-gray-400"
                              />

                              {formatDueDate(assignment.dueDate)}
                            </div>
                          </td>

                          {/* STATUS */}

                          <td className="px-6 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyle.badge}`}
                            >
                              <StatusIcon size={14} />

                              {assignment.status}
                            </span>
                          </td>

                          {/* ACTIONS */}

                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleView(assignment)}
                                title="View Assignment"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-blue-50 hover:text-[#1E3A8A]"
                              >
                                <Eye size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleEdit(assignment)}
                                title="Edit Assignment"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-yellow-50 hover:text-yellow-600"
                              >
                                <Pencil size={18} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDelete(assignment)}
                                disabled={actionStatus === "loading"}
                                title="Delete Assignment"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                <Trash2 size={18} />
                              </button>

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
          )}

          {/* ==================================================
                MOBILE CARDS
            ================================================== */}

          {filteredAssignments.length > 0 && (
            <div className="grid gap-4 md:hidden">
              {filteredAssignments.map((assignment) => {
                const statusStyle = getStatusStyle(assignment.status);

                const StatusIcon = statusStyle.icon;

                const submissionStatus = getSubmissionStatus(assignment);

                const submissionPercentage =
                  getSubmissionPercentage(assignment);

                const gradingPercentage = getGradingPercentage(assignment);

                return (
                  <div
                    key={assignment.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    {/* HEADER */}

                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#1E3A8A]/10 text-[#1E3A8A]">
                          <ClipboardList size={22} />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-semibold leading-5 text-gray-900">
                            {assignment.title}
                          </h3>

                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              {assignment.type}
                            </span>

                            <span className="text-xs text-gray-400">
                              {assignment.points} points
                            </span>
                          </div>
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

                        {assignment.status}
                      </span>
                    </div>

                    {/* COURSE */}

                    <div className="mt-4 rounded-lg bg-gray-50 p-3">
                      <div className="flex items-start gap-2">
                        <BookOpen
                          size={17}
                          className="mt-0.5 shrink-0 text-[#1E3A8A]"
                        />

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                            Course
                          </p>

                          <p className="mt-1 text-sm font-semibold text-gray-800">
                            {assignment.courseName}
                          </p>

                          <p className="mt-1 text-xs text-gray-500">
                            Instructor: {assignment.instructorName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* DUE DATE */}

                    <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <CalendarDays size={17} className="text-gray-400" />

                        <span className="text-sm text-gray-600">Due Date</span>
                      </div>

                      <span className="text-sm font-semibold text-gray-800">
                        {formatDueDate(assignment.dueDate)}
                      </span>
                    </div>

                    {/* STUDENTS / SUBMISSIONS */}

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-2">
                          <Users size={17} className="text-[#B00000]" />

                          <span className="text-xs text-gray-500">
                            Students
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {assignment.students > 0 ? assignment.students : "—"}
                        </p>
                      </div>

                      <div className="rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-2">
                          <FileCheck2 size={17} className="text-[#1E3A8A]" />

                          <span className="text-xs text-gray-500">
                            Submissions
                          </span>
                        </div>

                        <p className="mt-1 text-lg font-bold text-gray-900">
                          {assignment.submissions}
                        </p>
                      </div>
                    </div>

                    {/* SUBMISSION PROGRESS */}

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">
                          Submission Progress
                        </span>

                        <span className="text-xs font-semibold text-gray-700">
                          {assignment.students > 0
                            ? `${submissionPercentage}%`
                            : "Not available"}
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-[#1E3A8A]"
                          style={{
                            width: `${submissionPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* GRADING PROGRESS */}

                    <div className="mt-4">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium ${submissionStatus.className}`}
                        >
                          {submissionStatus.label}
                        </span>

                        <span className="text-xs font-semibold text-gray-700">
                          {gradingPercentage}% graded
                        </span>
                      </div>

                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full bg-green-500"
                          style={{
                            width: `${gradingPercentage}%`,
                          }}
                        />
                      </div>
                    </div>

                    {/* ACTIONS */}

                    <div className="mt-4 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => handleView(assignment)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        <Eye size={16} />
                        View
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(assignment)}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                      >
                        <Pencil size={16} />
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(assignment)}
                        disabled={actionStatus === "loading"}
                        className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ==================================================
                EMPTY STATE
            ================================================== */}

          {filteredAssignments.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <GraduationCap size={28} />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {assignments.length === 0
                  ? "No assignments yet"
                  : "No assignments found"}
              </h3>

              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                {assignments.length === 0
                  ? "Create your first assignment to start managing student tasks and submissions."
                  : "Try changing your search or filters to find the assignment you are looking for."}
              </p>

              {hasFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B00000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                >
                  <X size={16} />
                  Clear Filters
                </button>
              ) : (
                assignments.length === 0 && (
                  <button
                    type="button"
                    onClick={handleAddAssignment}
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#B00000] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                  >
                    <Plus size={16} />
                    Add Assignment
                  </button>
                )
              )}
            </div>
          )}

          {/* ==================================================
                PAGINATION
            ================================================== */}

          {filteredAssignments.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-gray-500">
                Showing{" "}
                <span className="font-semibold text-gray-900">
                  {filteredAssignments.length}
                </span>{" "}
                assignment
                {filteredAssignments.length !== 1 ? "s" : ""}
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

export default Assignments;
