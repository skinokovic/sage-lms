import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  GraduationCap,
  Loader2,
  Mail,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Save,
  User,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { instructorSubmissionApi } from "../../api/instructorSubmissionApi";
import {
  formatScheduleDate,
  formatScheduleTime,
} from "../../utils/scheduleFormat";

const REVIEW_CHECKLIST = [
  "Correct student and assignment",
  "Submission content is accessible",
  "Required tasks have been addressed",
  "Supporting evidence or files are included",
  "Submission is ready for grading",
];

const statusStyles = {
  "Pending Review": "border-amber-200 bg-amber-50 text-amber-700",
  Graded: "border-green-200 bg-green-50 text-green-700",
  Returned: "border-blue-200 bg-blue-50 text-blue-700",
};

const shortId = (id) => `#${id.slice(-6).toUpperCase()}`;

const formatDateTime = (iso) =>
  `${formatScheduleDate(iso)}, ${formatScheduleTime(iso)}`;

const ReviewSubmission = () => {
  const navigate = useNavigate();
  const { submissionId } = useParams();

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notFound, setNotFound] = useState(false);

  const [checkedItems, setCheckedItems] = useState([]);
  const [instructorNotes, setInstructorNotes] = useState("");
  const [showGradeForm, setShowGradeForm] = useState(false);
  const [score, setScore] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState("");

  const goBack = () => navigate("/dashboard/instructor/submissions");

  // Puts a submission from the server into the page and its form fields
  const applySubmission = useCallback((data) => {
    setSubmission(data);
    setInstructorNotes(data.instructorNotes || "");
    setFeedback(data.feedback || "");
    setScore(
      data.score !== null && data.score !== undefined ? String(data.score) : "",
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    setNotFound(false);

    try {
      const { data } = await instructorSubmissionApi.get(submissionId);
      applySubmission(data.submission);
    } catch (error) {
      setNotFound(error.response?.status === 404);
      setLoadError(
        error.response?.data?.message || "Couldn't load this submission.",
      );
    } finally {
      setLoading(false);
    }
  }, [submissionId, applySubmission]);

  useEffect(() => {
    load();
  }, [load]);

  const allChecklistCompleted = checkedItems.length === REVIEW_CHECKLIST.length;

  const maxScore = submission?.assignment.points ?? 0;

  const percentage = useMemo(() => {
    if (
      !submission ||
      submission.score === null ||
      submission.score === undefined ||
      !maxScore
    ) {
      return null;
    }

    return Math.round((Number(submission.score) / Number(maxScore)) * 100);
  }, [submission, maxScore]);

  const toggleChecklistItem = (index) => {
    setCheckedItems((current) =>
      current.includes(index)
        ? current.filter((item) => item !== index)
        : [...current, index],
    );
  };

  /* --------------------------------- actions --------------------------------- */

  const handleSaveReview = async () => {
    if (!submission || busy) return;

    setBusy("notes");

    try {
      const { data } = await instructorSubmissionApi.saveNotes(submission.id, {
        instructorNotes,
      });

      setSubmission(data.submission);
      toast.success("Review notes saved.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't save your notes.");
    } finally {
      setBusy("");
    }
  };

  const handleSaveGrade = async () => {
    if (!submission || busy) return;

    const numericScore = Number(score);

    if (score === "" || Number.isNaN(numericScore)) {
      toast.error("Please enter a valid score.");
      return;
    }

    if (numericScore < 0 || numericScore > maxScore) {
      toast.error(`Score must be between 0 and ${maxScore}.`);
      return;
    }

    setBusy("grade");

    try {
      const { data } = await instructorSubmissionApi.grade(submission.id, {
        score: numericScore,
        feedback: feedback.trim(),
        instructorNotes,
      });

      applySubmission(data.submission);
      setShowGradeForm(false);
      toast.success("Graded. The student can now see their score.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Couldn't save the grade.");
    } finally {
      setBusy("");
    }
  };

  const handleReturn = async () => {
    if (!submission || busy) return;

    if (!feedback.trim()) {
      setShowGradeForm(true);
      toast.info(
        "Write feedback explaining what needs to improve, then choose Return for Revision.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const confirmed = window.confirm(
      `Return this submission to ${submission.student.name}? They will be able to resubmit.`,
    );

    if (!confirmed) return;

    setBusy("return");

    try {
      const { data } = await instructorSubmissionApi.returnForRevision(
        submission.id,
        { feedback: feedback.trim(), instructorNotes },
      );

      applySubmission(data.submission);
      setShowGradeForm(false);
      toast.success("Submission returned to the student.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't return the submission.",
      );
    } finally {
      setBusy("");
    }
  };

  /* ------------------------------ loading / error ------------------------------ */

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-3 py-24 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Loading submission…
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="mx-auto max-w-4xl">
        <div className="rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-primary">
            {notFound ? <X size={28} /> : <AlertCircle size={28} />}
          </div>

          <h1 className="mt-5 text-xl font-bold text-gray-900">
            {notFound
              ? "Submission not found"
              : "Couldn't load this submission"}
          </h1>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
            {notFound
              ? "This submission doesn't exist, or it doesn't belong to one of your assignments."
              : loadError}
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            {!notFound && (
              <button
                type="button"
                onClick={load}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Try Again
              </button>
            )}

            <button
              type="button"
              onClick={goBack}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              <ArrowLeft size={17} />
              Back to Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { student, assignment } = submission;

  return (
    <div className="mx-auto max-w-350 space-y-6">
      {/* HEADER */}
      <section className="flex flex-col gap-4">
        <button
          type="button"
          onClick={goBack}
          className="inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to Submissions
        </button>

        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-secondary">
                Submission {shortId(submission.id)}
              </span>

              <span
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${
                  statusStyles[submission.status]
                }`}
              >
                {submission.status === "Graded" ? (
                  <CheckCircle2 size={13} />
                ) : submission.status === "Returned" ? (
                  <RotateCcw size={13} />
                ) : (
                  <Clock3 size={13} />
                )}

                {submission.status}
              </span>

              {submission.submittedLate && (
                <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-primary">
                  Submitted Late
                </span>
              )}
            </div>

            <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Review Submission
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Review the student's work before finalizing the grade.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveReview}
              disabled={Boolean(busy)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "notes" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              Save Review
            </button>

            <button
              type="button"
              onClick={() => setShowGradeForm((current) => !current)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f0000]"
            >
              <GraduationCap size={17} />
              {submission.status === "Graded"
                ? "Update Grade"
                : "Grade Submission"}
            </button>
          </div>
        </div>
      </section>

      {submission.status === "Returned" && (
        <div className="flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          <RotateCcw size={18} className="mt-0.5 shrink-0" />
          This submission was returned for revision. When the student submits
          again, the new version will appear here.
        </div>
      )}

      {/* STUDENT / ASSIGNMENT SUMMARY */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {student.avatarUrl ? (
              <img
                src={student.avatarUrl}
                alt={student.name}
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-secondary">
                {student.initials}
              </div>
            )}

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Student
              </p>

              <h2 className="mt-1 truncate text-lg font-bold text-gray-900">
                {student.name}
              </h2>

              <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                <Mail size={13} />
                <span className="truncate">{student.email}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Assignment
          </p>

          <h2 className="mt-2 text-lg font-bold text-gray-900">
            {assignment.title}
          </h2>

          <p className="mt-1 text-sm text-gray-500">{assignment.course}</p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Submission Details
          </p>

          <div className="mt-3 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400">Submitted</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {formatScheduleDate(submission.submittedAt)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Type</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {assignment.submissionType}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Due</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {assignment.dueDate
                  ? formatScheduleDate(assignment.dueDate)
                  : "No due date"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-400">Total marks</p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {assignment.points}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* GRADE FORM */}
      {showGradeForm && (
        <section className="rounded-2xl border border-secondary/20 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-secondary">
              <GraduationCap size={20} />
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Grade Submission
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Enter the student's score and feedback. Feedback is required if
                you return the work for revision.
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Score
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max={maxScore}
                  step="0.5"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                  placeholder={`0 - ${maxScore}`}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition focus:border-secondary focus:bg-white"
                />

                <span className="whitespace-nowrap text-sm font-semibold text-gray-500">
                  / {maxScore}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Percentage
              </label>

              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm font-bold text-secondary">
                {score !== "" && !Number.isNaN(Number(score)) && maxScore
                  ? `${Math.round((Number(score) / maxScore) * 100)}%`
                  : "--"}
              </div>
            </div>
          </div>

          <div className="mt-5">
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Feedback to Student
            </label>

            <textarea
              rows={4}
              maxLength={2000}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Enter feedback for the student..."
              className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 outline-none transition focus:border-secondary focus:bg-white"
            />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowGradeForm(false)}
              disabled={Boolean(busy)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
            >
              <X size={17} />
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReturn}
              disabled={Boolean(busy)}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-secondary px-5 py-3 text-sm font-semibold text-secondary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "return" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <RotateCcw size={17} />
              )}
              Return for Revision
            </button>

            <button
              type="button"
              disabled={Boolean(busy)}
              onClick={handleSaveGrade}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "grade" ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Check size={17} />
              )}
              {busy === "grade" ? "Saving..." : "Save Grade"}
            </button>
          </div>
        </section>
      )}

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        {/* SUBMISSION CONTENT */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                  <FileText size={20} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Student Submission
                  </h2>

                  <p className="text-xs text-gray-500">
                    Submitted {formatDateTime(submission.submittedAt)}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-5">
                <p className="whitespace-pre-line text-sm leading-7 text-gray-700">
                  {submission.content ||
                    "The student did not write an answer. Check the attachment below."}
                </p>
              </div>
            </div>
          </section>

          {/* ASSIGNMENT BRIEF */}
          {(assignment.description || assignment.instructions) && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen size={19} />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    Assignment Brief
                  </h2>

                  <p className="text-xs text-gray-500">
                    What the student was asked to do
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-purple-100 bg-purple-50/50 p-4">
                {assignment.description && (
                  <p className="whitespace-pre-line text-sm leading-6 text-gray-700">
                    {assignment.description}
                  </p>
                )}

                {assignment.instructions && (
                  <p
                    className={`whitespace-pre-line text-sm leading-6 text-gray-700 ${
                      assignment.description
                        ? "mt-4 border-t border-purple-100 pt-4"
                        : ""
                    }`}
                  >
                    {assignment.instructions}
                  </p>
                )}
              </div>
            </section>
          )}

          {/* ATTACHMENT */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
                <Paperclip size={19} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-gray-900">Attachment</h2>

                <p className="text-xs text-gray-500">
                  Files submitted by the student
                </p>
              </div>
            </div>

            {submission.file ? (
              <div className="mt-5 flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-red-50 text-primary">
                    <FileText size={20} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-gray-900">
                      {submission.file.name}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Uploaded by the student
                    </p>
                  </div>
                </div>

                <a
                  href={submission.file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                >
                  <Download size={16} />
                  Open / Download
                </a>
              </div>
            ) : (
              <div className="mt-5 rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                <FileText size={28} className="mx-auto text-gray-300" />

                <p className="mt-3 text-sm font-semibold text-gray-600">
                  No file attachment
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  This submission was provided as text.
                </p>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-6">
          {/* CURRENT SCORE */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Current Score
                </p>

                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {submission.score !== null && submission.score !== undefined
                    ? submission.score
                    : "--"}
                  <span className="text-base font-medium text-gray-400">
                    /{maxScore}
                  </span>
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-secondary">
                <GraduationCap size={23} />
              </div>
            </div>

            {percentage !== null && (
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">
                    Percentage
                  </span>

                  <span className="text-sm font-bold text-secondary">
                    {percentage}%
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {submission.feedback && submission.status !== "Pending Review" && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Feedback sent to student
                </p>

                <p className="mt-2 whitespace-pre-line text-sm leading-6 text-gray-600">
                  {submission.feedback}
                </p>
              </div>
            )}
          </section>

          {/* REVIEW CHECKLIST */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Review Checklist
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Confirm the submission is ready for grading.
                </p>
              </div>

              {allChecklistCompleted && (
                <CheckCircle2 size={20} className="shrink-0 text-green-600" />
              )}
            </div>

            <div className="mt-5 space-y-3">
              {REVIEW_CHECKLIST.map((item, index) => {
                const checked = checkedItems.includes(index);

                return (
                  <button
                    key={item}
                    type="button"
                    onClick={() => toggleChecklistItem(index)}
                    className="flex w-full cursor-pointer items-start gap-3 text-left"
                  >
                    <span
                      className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                        checked
                          ? "border-secondary bg-secondary text-white"
                          : "border-gray-300 bg-white text-transparent"
                      }`}
                    >
                      <Check size={13} />
                    </span>

                    <span
                      className={`text-sm leading-5 ${
                        checked ? "text-gray-900 line-through" : "text-gray-600"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* INSTRUCTOR NOTES */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <MessageSquare size={18} />
              </div>

              <div>
                <h2 className="text-base font-bold text-gray-900">
                  Instructor Notes
                </h2>

                <p className="text-xs text-gray-500">
                  Private. The student can't see these.
                </p>
              </div>
            </div>

            <textarea
              rows={5}
              maxLength={2000}
              value={instructorNotes}
              onChange={(e) => setInstructorNotes(e.target.value)}
              placeholder="Write your review notes here..."
              className="mt-5 w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-secondary focus:bg-white"
            />

            <button
              type="button"
              onClick={handleSaveReview}
              disabled={Boolean(busy)}
              className="mt-3 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy === "notes" ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Save Notes
            </button>
          </section>

          {/* ACTIONS */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <User size={18} className="text-secondary" />

              <h2 className="text-base font-bold text-gray-900">
                Review Actions
              </h2>
            </div>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={handleSaveReview}
                disabled={Boolean(busy)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                Save Review
              </button>

              <button
                type="button"
                onClick={handleReturn}
                disabled={Boolean(busy)}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-secondary px-4 py-3 text-sm font-semibold text-secondary transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy === "return" ? (
                  <Loader2 size={17} className="animate-spin" />
                ) : (
                  <RotateCcw size={17} />
                )}
                Return for Revision
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowGradeForm(true);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                <GraduationCap size={17} />
                {submission.status === "Graded"
                  ? "Update Grade"
                  : "Grade Submission"}
              </button>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
};

export default ReviewSubmission;
