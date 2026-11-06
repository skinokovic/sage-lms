import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Pencil,
  CalendarDays,
  Clock3,
  BookOpen,
  User,
  ClipboardList,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Users,
  Award,
  FileText,
  Download,
  Mail,
  Loader2,
  RefreshCw,
  CalendarCheck2,
  Paperclip,
  FileUp,
} from "lucide-react";

import { toast } from "react-toastify";

import {
  fetchAssignment,
  clearSelectedAssignment,
} from "../../store/assignmentSlice";

const getNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

const getCourseName = (course) => {
  if (!course) return "—";

  if (typeof course === "string") return course;

  return course.title || course.name || "—";
};

const getInstructorName = (instructor) => {
  if (!instructor) return "—";

  if (typeof instructor === "string") return instructor;

  return instructor.name || instructor.fullName || "—";
};

const formatDate = (date) => {
  if (!date) return "No due date";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "Invalid date";
  }

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatDateTime = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const getStatusClass = (status) => {
  switch (status) {
    case "Published":
      return "bg-green-100 text-green-700";

    case "Closed":
      return "bg-gray-100 text-gray-700";

    case "Draft":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const getSubmissionStatusClass = (status) => {
  switch (status) {
    case "Graded":
      return "bg-green-100 text-green-700";

    case "Late":
      return "bg-red-100 text-red-700";

    case "Returned":
      return "bg-blue-100 text-blue-700";

    case "Submitted":
    default:
      return "bg-yellow-100 text-yellow-700";
  }
};

const AssignmentDetails = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { selectedAssignment, actionStatus, error } = useSelector(
    (state) => state.assignments,
  );

  useEffect(() => {
    if (id) {
      dispatch(fetchAssignment(id));
    }

    return () => {
      dispatch(clearSelectedAssignment());
    };
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const assignment = selectedAssignment;

  const submissions = useMemo(() => {
    if (!Array.isArray(assignment?.submissions)) {
      return [];
    }

    return assignment.submissions;
  }, [assignment]);

  const stats = useMemo(() => {
    const total = submissions.length;

    const graded = submissions.filter(
      (submission) => submission.status === "Graded",
    ).length;

    const late = submissions.filter(
      (submission) => submission.status === "Late",
    ).length;

    const pending = submissions.filter(
      (submission) => submission.status === "Submitted" || !submission.status,
    ).length;

    return {
      total,
      graded,
      late,
      pending,
    };
  }, [submissions]);

  const gradingPercentage =
    stats.total > 0 ? Math.round((stats.graded / stats.total) * 100) : 0;

  if (actionStatus === "loading" && !assignment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin text-[#B00000]" />

          <p className="text-sm">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/assignments")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#B00000]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Assignments
        </button>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Assignment not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The assignment may have been deleted or the requested ID is invalid.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/assignments")}
            className="mt-5 rounded-lg bg-[#B00000] px-5 py-2.5 text-sm font-medium text-white hover:bg-red-800"
          >
            Back to Assignments
          </button>
        </div>
      </div>
    );
  }

  const courseName = getCourseName(assignment.course);
  const instructorName = getInstructorName(assignment.instructor);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/assignments")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#B00000]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Assignments
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              {assignment.title || "Untitled Assignment"}
            </h1>

            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                assignment.status,
              )}`}
            >
              {assignment.status || "Draft"}
            </span>
          </div>

          <p className="mt-2 text-sm text-gray-500">
            View assignment details, submission activity and grading progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            navigate(
              `/dashboard/admin/assignments/${assignment.id || assignment._id}/edit`,
            )
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-800"
        >
          <Pencil className="h-4 w-4" />
          Edit Assignment
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Submissions</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.total}
              </p>
            </div>

            <div className="rounded-lg bg-blue-50 p-3">
              <ClipboardList className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Graded</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.graded}
              </p>
            </div>

            <div className="rounded-lg bg-green-50 p-3">
              <FileCheck2 className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {stats.pending}
              </p>
            </div>

            <div className="rounded-lg bg-yellow-50 p-3">
              <Clock3 className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Grading Progress</p>

              <p className="mt-2 text-2xl font-bold text-gray-900">
                {gradingPercentage}%
              </p>
            </div>

            <div className="rounded-lg bg-purple-50 p-3">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Main information */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Assignment information */}
        <div className="xl:col-span-2 rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Assignment Information
            </h2>
          </div>

          <div className="p-5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Description
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {assignment.description || "No description provided."}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                Instructions
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-600">
                {assignment.instructions ||
                  "No specific instructions provided."}
              </p>
            </div>
          </div>
        </div>

        {/* Details */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">Details</h2>
          </div>

          <div className="divide-y divide-gray-100">
            <div className="flex gap-3 px-5 py-4">
              <BookOpen className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Course</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {courseName}
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <User className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Instructor</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {instructorName}
                </p>

                {assignment.instructor?.email && (
                  <p className="mt-1 text-xs text-gray-500">
                    {assignment.instructor.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <FileText className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Assignment Type</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {assignment.type || "Assignment"}
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <Award className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Points</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {getNumber(assignment.points)} points
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Passing Score</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {getNumber(assignment.passingScore)} points
                </p>
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <CalendarDays className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Due Date</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {formatDate(assignment.dueDate)}
                </p>

                {assignment.dueDate && (
                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(assignment.dueDate).toLocaleTimeString("en-US", {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-5 py-4">
              <Clock3 className="mt-0.5 h-5 w-5 text-[#B00000]" />

              <div>
                <p className="text-xs text-gray-500">Maximum Attempts</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {getNumber(assignment.maxAttempts) || 1}
                </p>
              </div>
            </div>

            {/* Submission Type */}
            <div className="flex gap-3 px-5 py-4">
              <FileUp className="mt-0.5 h-5 w-5 shrink-0 text-[#B00000]" />

              <div className="min-w-0">
                <p className="text-xs text-gray-500">Submission Type</p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {assignment.submissionType || "Not specified"}
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  How students are expected to submit their work
                </p>
              </div>
            </div>

            {/* Attachment Required */}
            <div className="flex gap-3 px-5 py-4">
              <Paperclip className="mt-0.5 h-5 w-5 shrink-0 text-[#B00000]" />

              <div className="min-w-0">
                <p className="text-xs text-gray-500">Attachment Required</p>

                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                      assignment.attachmentRequired
                        ? "bg-red-50 text-[#B00000]"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {assignment.attachmentRequired
                      ? "Required"
                      : "Not Required"}
                  </span>
                </div>

                <p className="mt-1 text-xs text-gray-400">
                  Whether students must attach a file
                </p>
              </div>
            </div>

            {/* Published At */}
            {assignment.publishedAt && (
              <div className="flex gap-3 px-5 py-4">
                <CalendarCheck2 className="mt-0.5 h-5 w-5 shrink-0 text-[#B00000]" />

                <div className="min-w-0">
                  <p className="text-xs text-gray-500">Published</p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDateTime(assignment.publishedAt)}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Assignment publication date and time
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submission progress */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Grading Progress
            </h2>

            <p className="text-sm text-gray-500">
              {stats.graded} of {stats.total} submissions graded
            </p>
          </div>

          <span className="text-lg font-bold text-[#B00000]">
            {gradingPercentage}%
          </span>
        </div>

        <div className="mt-4 h-3 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#B00000] transition-all"
            style={{
              width: `${gradingPercentage}%`,
            }}
          />
        </div>
      </div>

      {/* Submissions */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Student Submissions
            </h2>

            <p className="text-sm text-gray-500">
              View submitted work and grading status.
            </p>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="h-4 w-4" />
            {stats.total} submission
            {stats.total !== 1 ? "s" : ""}
          </div>
        </div>

        {submissions.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <ClipboardList className="mx-auto h-12 w-12 text-gray-300" />

            <h3 className="mt-4 text-sm font-semibold text-gray-900">
              No submissions yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Student submissions will appear here once they are received.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Student
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Submitted
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Score
                    </th>

                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Feedback
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 bg-white">
                  {submissions.map((submission) => {
                    const student = submission.student;

                    const studentName =
                      typeof student === "string"
                        ? student
                        : student?.name || "Unknown Student";

                    const studentEmail =
                      typeof student === "object" ? student?.email : "";

                    return (
                      <tr
                        key={submission.id || submission._id}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                              {studentName.charAt(0).toUpperCase()}
                            </div>

                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {studentName}
                              </p>

                              {studentEmail && (
                                <p className="text-xs text-gray-500">
                                  {studentEmail}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm text-gray-600">
                          {formatDateTime(submission.submittedAt)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getSubmissionStatusClass(
                              submission.status,
                            )}`}
                          >
                            {submission.status || "Submitted"}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-gray-900">
                          {submission.score !== null &&
                          submission.score !== undefined
                            ? `${submission.score}/${assignment.points}`
                            : "Not graded"}
                        </td>

                        <td className="max-w-xs px-5 py-4 text-sm text-gray-500">
                          <p className="truncate">
                            {submission.feedback || "No feedback"}
                          </p>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {submissions.map((submission) => {
                const student = submission.student;

                const studentName =
                  typeof student === "string"
                    ? student
                    : student?.name || "Unknown Student";

                const studentEmail =
                  typeof student === "object" ? student?.email : "";

                return (
                  <div key={submission.id || submission._id} className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                          {studentName.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {studentName}
                          </p>

                          {studentEmail && (
                            <p className="text-xs text-gray-500">
                              {studentEmail}
                            </p>
                          )}
                        </div>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${getSubmissionStatusClass(
                          submission.status,
                        )}`}
                      >
                        {submission.status || "Submitted"}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-500">Submitted</p>

                        <p className="mt-1 text-sm text-gray-900">
                          {formatDateTime(submission.submittedAt)}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-gray-500">Score</p>

                        <p className="mt-1 text-sm font-medium text-gray-900">
                          {submission.score !== null &&
                          submission.score !== undefined
                            ? `${submission.score}/${assignment.points}`
                            : "Not graded"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-xs text-gray-500">Feedback</p>

                      <p className="mt-1 text-sm text-gray-600">
                        {submission.feedback || "No feedback"}
                      </p>
                    </div>

                    {submission.fileUrl && (
                      <a
                        href={submission.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#B00000] hover:underline"
                      >
                        <Download className="h-4 w-4" />
                        View submitted file
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Assignment resources */}
      {Array.isArray(assignment.resources) &&
        assignment.resources.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-5 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
            </div>

            <div className="divide-y divide-gray-100">
              {assignment.resources.map((resource, index) => (
                <div
                  key={resource.id || resource._id || index}
                  className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gray-100 p-2">
                      <FileText className="h-5 w-5 text-gray-600" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {resource.name || `Resource ${index + 1}`}
                      </p>

                      <p className="text-xs text-gray-500">
                        {resource.type || "Document"}
                      </p>
                    </div>
                  </div>

                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Download className="h-4 w-4" />
                      Open Resource
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Footer metadata */}
      <div className="flex flex-col gap-2 border-t border-gray-200 pt-4 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <span>Created: {formatDateTime(assignment.createdAt)}</span>

        <span>Last updated: {formatDateTime(assignment.updatedAt)}</span>
      </div>
    </div>
  );
};

export default AssignmentDetails;
