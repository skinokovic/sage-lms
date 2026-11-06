import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  Lock,
  Paperclip,
  RotateCcw,
  Send,
  Trash2,
  UploadCloud,
  User,
} from "lucide-react";
import {
  clearCurrentAssignment,
  clearSubmitError,
  fetchMyAssignmentById,
  submitMyAssignment,
} from "../../store/studentAssignmentSlice";
import {
  formatDateTime,
  formatDueDate,
  formatDueTime,
  formatFileSize,
} from "../../utils/assignmentHelpers";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".zip",
  ".rar",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
];

const statusConfig = {
  Pending: { icon: AlertCircle, className: "bg-red-50 text-[#B00000]" },
  Submitted: { icon: Send, className: "bg-amber-50 text-amber-700" },
  Graded: { icon: CheckCircle2, className: "bg-green-50 text-green-700" },
};

const AssignmentDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const { current, currentStatus, currentError, submitting, submitError } =
    useSelector((state) => state.studentAssignments);

  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [formError, setFormError] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    dispatch(fetchMyAssignmentById(id));

    return () => {
      dispatch(clearCurrentAssignment());
    };
  }, [dispatch, id]);

  const goBack = () => navigate("..", { relative: "path" });

  const ready = current && current.id === id;
  const isLoading =
    !ready && (currentStatus === "idle" || currentStatus === "loading");

  /* ---------------------------- Loading / Error --------------------------- */

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-100" />
        <div className="animate-pulse space-y-3 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="h-4 w-1/3 rounded bg-gray-100" />
          <div className="h-8 w-2/3 rounded bg-gray-100" />
          <div className="h-4 w-1/2 rounded bg-gray-100" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100 lg:col-span-2" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="space-y-6">
        <BackButton onClick={goBack} />

        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <FileText size={30} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Couldn't load this assignment
          </h3>

          <p className="mt-2 text-sm text-gray-500">{currentError}</p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => dispatch(fetchMyAssignmentById(id))}
              className="rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={goBack}
              className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------- Derived -------------------------------- */

  const assignment = current;
  const config = statusConfig[assignment.status];
  const StatusIcon = config.icon;

  const acceptsText = assignment.submissionType !== "File Upload";
  const acceptsFile = assignment.submissionType !== "Text Submission";
  const textRequired = assignment.submissionType === "Text Submission";
  const fileRequired =
    acceptsFile &&
    (assignment.submissionType === "File Upload" ||
      assignment.attachmentRequired);

  const returnedFeedback = assignment.isReturned
    ? assignment.submissions[0]?.feedback
    : "";

  const pastDue =
    Boolean(assignment.dueDate) && new Date(assignment.dueDate) < new Date();
  const scorePercent =
    assignment.totalMarks > 0
      ? Math.round(((assignment.score ?? 0) / assignment.totalMarks) * 100)
      : 0;

  /* ------------------------------- Handlers ------------------------------- */

  const pickFile = (fileList) => {
    setFormError("");
    dispatch(clearSubmitError());

    const picked = fileList?.[0];
    if (!picked) return;

    const extension = `.${picked.name.split(".").pop().toLowerCase()}`;

    if (!ALLOWED_EXTENSIONS.includes(extension)) {
      return setFormError(`"${picked.name}" is not a supported file type.`);
    }

    if (picked.size > MAX_FILE_SIZE) {
      return setFormError(`"${picked.name}" is larger than 10MB.`);
    }

    setFile(picked);
  };

  const removeFile = () => {
    setFile(null);
    setFormError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setJustSubmitted(false);

    const trimmed = text.trim();

    if (textRequired && !trimmed) {
      return setFormError("Please write your answer before submitting.");
    }

    if (fileRequired && !file) {
      return setFormError("Please attach a file.");
    }

    if (assignment.submissionType === "Both" && !trimmed && !file) {
      return setFormError("Please write an answer or attach a file.");
    }

    const formData = new FormData();
    if (acceptsText) formData.append("textContent", trimmed);
    if (acceptsFile && file) formData.append("file", file);

    const result = await dispatch(
      submitMyAssignment({ id: assignment.id, formData }),
    );

    if (submitMyAssignment.fulfilled.match(result)) {
      setText("");
      setFile(null);
      setJustSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  /* -------------------------------- Render -------------------------------- */

  return (
    <div className="space-y-6">
      <BackButton onClick={goBack} />

      {/* Header */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
            {assignment.course}
          </span>

          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {assignment.type}
          </span>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${config.className}`}
          >
            <StatusIcon size={13} />
            {assignment.status}
          </span>

          {assignment.isReturned && (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              Returned
            </span>
          )}

          {assignment.isOverdue && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#B00000]">
              Overdue
            </span>
          )}

          {assignment.isClosed && (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
              Closed
            </span>
          )}
        </div>

        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
          {assignment.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <CalendarDays size={15} className="text-[#1E3A8A]" />
            <span>
              Due:{" "}
              <strong className="text-gray-700">
                {formatDueDate(assignment.dueDate)}
              </strong>
            </span>
          </div>

          {assignment.dueDate && (
            <div className="flex items-center gap-2">
              <Clock3 size={15} className="text-[#1E3A8A]" />
              <span>{formatDueTime(assignment.dueDate)}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <FileCheck2 size={15} className="text-[#1E3A8A]" />
            <span>{assignment.totalMarks} marks</span>
          </div>

          <div className="flex items-center gap-2">
            <User size={15} className="text-[#1E3A8A]" />
            <span>{assignment.instructor}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ------------------------------ Left ------------------------------ */}
        <div className="space-y-6 lg:col-span-2">
          {justSubmitted && (
            <div className="flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Submitted successfully</p>
                <p className="mt-1 text-green-700">
                  Your instructor will review your work and post your grade
                  here.
                </p>
              </div>
            </div>
          )}

          {assignment.isReturned && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="flex items-center gap-2 font-semibold">
                <RotateCcw size={16} />
                Returned for revision
              </p>

              {returnedFeedback && (
                <p className="mt-2 whitespace-pre-line leading-6 text-amber-700">
                  {returnedFeedback}
                </p>
              )}
            </div>
          )}

          <Card title="About this assignment">
            <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
              {assignment.description || "No description provided."}
            </p>
          </Card>

          {assignment.instructions && (
            <Card title="Instructions">
              <p className="whitespace-pre-line text-sm leading-6 text-gray-600">
                {assignment.instructions}
              </p>
            </Card>
          )}

          {assignment.resources.length > 0 && (
            <Card title="Resources">
              <div className="space-y-3">
                {assignment.resources.map((resource) => (
                  <a
                    key={resource.id}
                    href={resource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition hover:bg-gray-100"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <Paperclip
                        size={16}
                        className="shrink-0 text-[#1E3A8A]"
                      />
                      <span className="truncate font-medium text-gray-700">
                        {resource.name}
                      </span>
                    </span>
                    <Download size={16} className="shrink-0 text-gray-400" />
                  </a>
                ))}
              </div>
            </Card>
          )}

          {/* Existing submission */}
          {assignment.submissions.length > 0 && (
            <Card title="Your submission">
              <SubmissionItem
                submission={assignment.submissions[0]}
                totalMarks={assignment.totalMarks}
              />
            </Card>
          )}

          {/* Submit form */}
          {assignment.canSubmit ? (
            <Card
              title={
                assignment.isReturned
                  ? "Resubmit your work"
                  : "Submit your work"
              }
            >
              <form onSubmit={handleSubmit} className="space-y-5">
                {assignment.isReturned && (
                  <div className="flex items-start gap-2 rounded-xl bg-blue-50 p-3 text-xs text-[#1E3A8A]">
                    <RotateCcw size={15} className="mt-0.5 shrink-0" />
                    Submitting again replaces your previous submission.
                  </div>
                )}

                {pastDue && (
                  <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertCircle size={15} className="mt-0.5 shrink-0" />
                    The due date has passed. This submission will be marked as
                    late.
                  </div>
                )}

                {acceptsText && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Your answer{" "}
                      {!textRequired && (
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      )}
                    </label>

                    <textarea
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      rows={7}
                      maxLength={20000}
                      placeholder="Type your answer here..."
                      className="mt-2 w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
                    />

                    <p className="mt-1 text-right text-xs text-gray-400">
                      {text.length}/20000
                    </p>
                  </div>
                )}

                {acceptsFile && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">
                      Attachment{" "}
                      {!fileRequired && (
                        <span className="font-normal text-gray-400">
                          (optional)
                        </span>
                      )}
                    </label>

                    <div
                      onDragOver={(event) => {
                        event.preventDefault();
                        setDragging(true);
                      }}
                      onDragLeave={() => setDragging(false)}
                      onDrop={(event) => {
                        event.preventDefault();
                        setDragging(false);
                        pickFile(event.dataTransfer.files);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`mt-2 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition ${
                        dragging
                          ? "border-[#1E3A8A] bg-blue-50"
                          : "border-gray-200 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <UploadCloud size={28} className="text-[#1E3A8A]" />

                      <p className="mt-2 text-sm font-medium text-gray-700">
                        Click to browse or drag a file here
                      </p>

                      <p className="mt-1 text-xs text-gray-400">
                        One file, up to 10MB (PDF, Word, Excel, PowerPoint, ZIP,
                        images, text). Zip multiple files together.
                      </p>

                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={ALLOWED_EXTENSIONS.join(",")}
                        className="hidden"
                        onChange={(event) => {
                          pickFile(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </div>

                    {file && (
                      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm">
                        <span className="flex min-w-0 items-center gap-3">
                          <Paperclip
                            size={16}
                            className="shrink-0 text-[#1E3A8A]"
                          />
                          <span className="truncate font-medium text-gray-700">
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-gray-400">
                            {formatFileSize(file.size)}
                          </span>
                        </span>

                        <button
                          type="button"
                          onClick={removeFile}
                          className="shrink-0 text-gray-400 hover:text-[#B00000]"
                          aria-label={`Remove ${file.name}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {(formError || submitError) && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 p-3 text-sm text-[#B00000]">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    {formError || submitError}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      {assignment.isReturned
                        ? "Resubmit Assignment"
                        : "Submit Assignment"}
                    </>
                  )}
                </button>
              </form>
            </Card>
          ) : (
            <div className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 text-sm text-gray-600 shadow-sm">
              <Lock size={18} className="mt-0.5 shrink-0 text-gray-400" />
              {assignment.submitBlockedReason}
            </div>
          )}
        </div>

        {/* ------------------------------ Right ----------------------------- */}
        <div className="space-y-6">
          {assignment.status === "Graded" ? (
            <div className="rounded-2xl bg-green-50 p-5 text-center shadow-sm">
              <p className="text-xs font-medium text-green-700">Your Score</p>

              <p className="mt-1 text-4xl font-bold text-green-700">
                {assignment.score ?? 0}
                <span className="text-xl">/{assignment.totalMarks}</span>
              </p>

              <p className="mt-1 text-sm text-green-600">{scorePercent}%</p>
            </div>
          ) : assignment.status === "Submitted" ? (
            <div className="rounded-2xl bg-amber-50 p-5 text-center shadow-sm">
              <Send size={24} className="mx-auto text-amber-600" />

              <p className="mt-2 text-sm font-semibold text-amber-800">
                Submitted
              </p>

              <p className="mt-1 text-xs text-amber-700">
                Awaiting instructor review
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-red-50 p-5 text-center shadow-sm">
              <AlertCircle size={24} className="mx-auto text-[#B00000]" />

              <p className="mt-2 text-sm font-semibold text-[#B00000]">
                {assignment.isReturned
                  ? "Resubmission Required"
                  : assignment.isOverdue
                    ? "Overdue"
                    : "Action Required"}
              </p>

              <p className="mt-1 text-xs text-red-700">
                {!assignment.canSubmit
                  ? "Submissions are closed"
                  : assignment.isReturned
                    ? "Returned for revision"
                    : assignment.isOverdue
                      ? "Late submissions accepted"
                      : "Submit before the due date"}
              </p>
            </div>
          )}

          <Card title="Details">
            <div className="divide-y divide-gray-100">
              <InfoRow
                icon={CalendarDays}
                label="Due date"
                value={
                  assignment.dueDate
                    ? formatDateTime(assignment.dueDate)
                    : "No due date"
                }
              />
              <InfoRow
                icon={FileCheck2}
                label="Total marks"
                value={assignment.totalMarks}
              />
              <InfoRow
                icon={FileText}
                label="Submission type"
                value={assignment.submissionType}
              />
              <InfoRow
                icon={Clock3}
                label="Late submissions"
                value={
                  assignment.allowLateSubmission ? "Allowed" : "Not allowed"
                }
              />
              <InfoRow
                icon={User}
                label="Instructor"
                value={assignment.instructor}
              />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------ Sub components ----------------------------- */

const BackButton = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#1E3A8A]"
  >
    <ArrowLeft size={17} />
    Back to Assignments
  </button>
);

const Card = ({ title, children }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <h2 className="mb-4 text-lg font-bold text-gray-900">{title}</h2>
    {children}
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between gap-4 py-3 text-sm">
    <span className="flex items-center gap-2 text-gray-500">
      <Icon size={15} className="text-[#1E3A8A]" />
      {label}
    </span>
    <span className="text-right font-medium text-gray-900">{value}</span>
  </div>
);

const SubmissionItem = ({ submission, totalMarks }) => (
  <div className="rounded-xl border border-gray-200 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            submission.status === "Graded"
              ? "bg-green-50 text-green-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {submission.status}
        </span>

        {submission.isLate && (
          <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-[#B00000]">
            Late
          </span>
        )}
      </div>

      <span className="text-xs text-gray-400">
        Submitted {formatDateTime(submission.submittedAt)}
      </span>
    </div>

    {submission.textContent && (
      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-gray-50 p-4 text-sm leading-6 text-gray-600">
        {submission.textContent}
      </p>
    )}

    {submission.attachments.length > 0 && (
      <div className="mt-3 space-y-2">
        {submission.attachments.map((file) => (
          <a
            key={file.id}
            href={file.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition hover:bg-gray-100"
          >
            <span className="flex min-w-0 items-center gap-3">
              <Paperclip size={16} className="shrink-0 text-[#1E3A8A]" />
              <span className="truncate font-medium text-gray-700">
                {file.name}
              </span>
              {file.size > 0 && (
                <span className="shrink-0 text-xs text-gray-400">
                  {formatFileSize(file.size)}
                </span>
              )}
            </span>
            <Download size={16} className="shrink-0 text-gray-400" />
          </a>
        ))}
      </div>
    )}

    {submission.status === "Graded" && (
      <div className="mt-3 rounded-xl bg-green-50 p-4">
        <p className="text-sm font-semibold text-green-800">
          Score: {submission.score ?? 0}/{totalMarks}
        </p>

        {submission.feedback && (
          <p className="mt-2 whitespace-pre-line text-sm leading-6 text-green-700">
            {submission.feedback}
          </p>
        )}
      </div>
    )}
  </div>
);

export default AssignmentDetails;
