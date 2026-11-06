import { useEffect, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  FileText,
  HelpCircle,
  Info,
  Link2,
  Lock,
  Save,
  Upload,
  X,
} from "lucide-react";

import { courseApi } from "../../api/courseApi";
import { lagosToIso } from "../../utils/scheduleFormat";

const ASSIGNMENT_TYPES = [
  {
    value: "Assignment",
    label: "Assignment",
    description: "Standard written or practical task",
    icon: FileText,
  },
  {
    value: "Project",
    label: "Project",
    description: "Larger practical or technical project",
    icon: BookOpen,
  },
  {
    value: "Case Study",
    label: "Case Study",
    description: "Analyze a real-world scenario",
    icon: HelpCircle,
  },
  {
    value: "Practical",
    label: "Practical",
    description: "Hands-on practical assessment",
    icon: CheckCircle2,
  },
];

const INITIAL_FORM = {
  title: "",
  course: "",
  type: "Assignment",
  description: "",
  instructions: "",
  points: "100",
  dueDate: "",
  dueTime: "",
  status: "Draft",
  submissionType: "File Upload",
  attachmentRequired: false,
  allowLateSubmission: true,
  resources: [],
};

const AssignmentForm = ({
  initialData = null,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Create Assignment",
}) => {
  const [formData, setFormData] = useState(
    initialData
      ? {
          ...INITIAL_FORM,
          ...initialData,
        }
      : INITIAL_FORM,
  );

  const [errors, setErrors] = useState({});
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceError, setResourceError] = useState("");

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...INITIAL_FORM,
        ...initialData,
      });
    }
  }, [initialData]);

  // The instructor's real courses
  useEffect(() => {
    let active = true;

    courseApi
      .mine({ limit: 50 })
      .then(({ data }) => {
        if (active) setCourses(data.courses || []);
      })
      .catch(() => {})
      .finally(() => active && setCoursesLoading(false));

    return () => {
      active = false;
    };
  }, []);

  const courseOptions = courses.filter(
    (course) => course.status !== "Archived" || course.id === formData.course,
  );

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Assignment title is required.";
    }

    if (!formData.course) {
      newErrors.course = "Please select a course.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Assignment description is required.";
    }

    if (!formData.instructions.trim()) {
      newErrors.instructions = "Please provide instructions for students.";
    }

    if (!formData.points) {
      newErrors.points = "Maximum points are required.";
    } else if (Number(formData.points) <= 0) {
      newErrors.points = "Points must be greater than zero.";
    }

    if (!formData.dueDate) {
      newErrors.dueDate = "Please select a due date.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (submitting || !validate()) {
      return;
    }

    onSubmit?.({
      title: formData.title.trim(),
      course: formData.course,
      type: formData.type,
      description: formData.description.trim(),
      instructions: formData.instructions.trim(),
      points: Number(formData.points),
      // Nigerian time; defaults to the end of the day when no time is chosen
      dueDate: lagosToIso(formData.dueDate, formData.dueTime || "23:59"),
      submissionType: formData.submissionType,
      attachmentRequired:
        formData.submissionType === "Both" && formData.attachmentRequired,
      allowLateSubmission: formData.allowLateSubmission,
      status: formData.status,
      resources: (formData.resources || []).map(({ name, url }) => ({
        name,
        url,
      })),
    });
  };

  const addResource = () => {
    const url = resourceUrl.trim();

    if (!url) return;

    if (!/^https?:\/\/\S+$/i.test(url)) {
      setResourceError("Enter a link starting with http:// or https://");
      return;
    }

    let name = url;
    try {
      name = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      // keep the full link as the name
    }

    setFormData((previous) => ({
      ...previous,
      resources: [
        ...(previous.resources || []),
        { id: `resource-${Date.now()}`, url, name },
      ],
    }));

    setResourceUrl("");
    setResourceError("");
  };

  const removeResource = (resourceId) => {
    setFormData((previous) => ({
      ...previous,
      resources: previous.resources.filter(
        (resource) => resource.id !== resourceId,
      ),
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =====================================================
          BASIC INFORMATION
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={FileText}
          title="Assignment Information"
          description="Enter the basic information students will see."
        />

        <div className="space-y-5 p-5 sm:p-6">
          {/* Title */}

          <FormField label="Assignment Title" required error={errors.title}>
            <input
              type="text"
              name="title"
              value={formData.title}
              maxLength={150}
              onChange={handleChange}
              placeholder="e.g. PID Control System Design"
              className={inputClass(errors.title)}
            />
          </FormField>

          {/* Course / Type */}

          <div className="grid gap-5 md:grid-cols-2">
            <FormField label="Course" required error={errors.course}>
              <select
                name="course"
                value={formData.course}
                onChange={handleChange}
                disabled={coursesLoading}
                className={`${inputClass(errors.course)} cursor-pointer`}
              >
                <option value="">
                  {coursesLoading ? "Loading courses..." : "Select course"}
                </option>

                {courseOptions.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>

              {!coursesLoading && courses.length === 0 && (
                <p className="mt-1 text-xs text-amber-700">
                  You don't have any courses yet. Create a course first.
                </p>
              )}
            </FormField>

            <FormField label="Assignment Type" required>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className={`${inputClass()} cursor-pointer`}
              >
                {ASSIGNMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          {/* Description */}

          <FormField label="Description" required error={errors.description}>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={5}
              maxLength={1000}
              placeholder="Briefly explain what this assignment is about..."
              className={`${inputClass(errors.description)} resize-none`}
            />

            <div className="mt-1 flex justify-end">
              <span className="text-xs text-gray-400">
                {formData.description.length}/1000
              </span>
            </div>
          </FormField>

          {/* Instructions */}

          <FormField
            label="Student Instructions"
            required
            error={errors.instructions}
          >
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              rows={8}
              maxLength={5000}
              placeholder="Provide detailed instructions for completing the assignment..."
              className={`${inputClass(errors.instructions)} resize-none`}
            />

            <p className="mt-1 text-xs text-gray-400">
              Clearly explain what students need to submit and any requirements
              they must follow.
            </p>
          </FormField>
        </div>
      </section>

      {/* =====================================================
          GRADING & DEADLINE
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={CalendarDays}
          title="Grading & Deadline"
          description="Set the marks and submission deadline (Nigerian time, WAT)."
        />

        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-5 md:grid-cols-3">
            <FormField label="Maximum Points" required error={errors.points}>
              <input
                type="number"
                name="points"
                min="1"
                max="1000"
                value={formData.points}
                onChange={handleChange}
                className={inputClass(errors.points)}
              />
            </FormField>

            <FormField label="Due Date" required error={errors.dueDate}>
              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={inputClass(errors.dueDate)}
              />
            </FormField>

            <FormField label="Due Time">
              <input
                type="time"
                name="dueTime"
                value={formData.dueTime}
                onChange={handleChange}
                className={inputClass()}
              />

              <p className="mt-1 text-xs text-gray-400">
                Leave empty for 11:59 PM.
              </p>
            </FormField>
          </div>

          {/* Late Submission */}

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                name="allowLateSubmission"
                checked={formData.allowLateSubmission}
                onChange={handleChange}
                className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#B00000] focus:ring-[#B00000]"
              />

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Allow late submissions
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Students can still submit after the deadline. Late work is
                  clearly flagged when you review it.
                </p>
              </div>
            </label>
          </div>

          {/* Resubmission note */}

          <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#1E3A8A]" />

            <p className="text-xs leading-5 text-blue-800">
              Each student submits once. If someone needs to redo their work,
              open their submission and choose{" "}
              <strong>Return for Revision</strong>. They will be able to submit
              again.
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          SUBMISSION SETTINGS
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={Upload}
          title="Submission Settings"
          description="Choose how students should submit their work."
        />

        <div className="space-y-5 p-5 sm:p-6">
          <FormField label="Submission Type">
            <div className="grid gap-3 sm:grid-cols-3">
              <SubmissionOption
                value="File Upload"
                current={formData.submissionType}
                title="File Upload"
                description="Students upload a file."
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    submissionType: "File Upload",
                  }))
                }
              />

              <SubmissionOption
                value="Text Submission"
                current={formData.submissionType}
                title="Text"
                description="Students write their answer."
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    submissionType: "Text Submission",
                  }))
                }
              />

              <SubmissionOption
                value="Both"
                current={formData.submissionType}
                title="Text + File"
                description="Students write an answer and can attach a file."
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    submissionType: "Both",
                  }))
                }
              />
            </div>
          </FormField>

          {formData.submissionType === "Both" && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  name="attachmentRequired"
                  checked={formData.attachmentRequired}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 cursor-pointer rounded border-gray-300 text-[#B00000] focus:ring-[#B00000]"
                />

                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    Require a file attachment
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    Students must attach a file in addition to their written
                    answer.
                  </p>
                </div>
              </label>
            </div>
          )}

          {formData.submissionType !== "Text Submission" && (
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />

              <p className="text-xs leading-5 text-gray-600">
                Students can attach one file of up to 10MB (PDF, Word, Excel,
                PowerPoint, ZIP, images or text). For several files, they should
                zip them together.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          RESOURCES
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={Link2}
          title="Assignment Resources"
          description="Add useful links students can reference."
        />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="url"
              value={resourceUrl}
              onChange={(event) => {
                setResourceUrl(event.target.value);
                setResourceError("");
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addResource();
                }
              }}
              placeholder="https://example.com/resource"
              className={inputClass(resourceError)}
            />

            <button
              type="button"
              onClick={addResource}
              className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Link2 className="h-4 w-4" />
              Add Resource
            </button>
          </div>

          {resourceError && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {resourceError}
            </p>
          )}

          {formData.resources?.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {resource.name}
                    </p>

                    <p className="truncate text-xs text-gray-400">
                      {resource.url}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResource(resource.id)}
                    className="cursor-pointer rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove resource"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================================
          STATUS
      ===================================================== */}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <SectionHeader
          icon={CheckCircle2}
          title="Assignment Status"
          description="Choose whether this assignment should remain a draft or be published."
        />

        <div className="p-5 sm:p-6">
          <div
            className={`grid gap-3 ${
              isEditing ? "sm:grid-cols-3" : "sm:grid-cols-2"
            }`}
          >
            <StatusOption
              value="Draft"
              current={formData.status}
              title="Save as Draft"
              description="Continue working on the assignment before publishing."
              onClick={() =>
                setFormData((previous) => ({
                  ...previous,
                  status: "Draft",
                }))
              }
            />

            <StatusOption
              value="Published"
              current={formData.status}
              title="Publish Assignment"
              description="Make the assignment available to students."
              onClick={() =>
                setFormData((previous) => ({
                  ...previous,
                  status: "Published",
                }))
              }
            />

            {isEditing && (
              <StatusOption
                value="Closed"
                current={formData.status}
                title="Close Assignment"
                description="Students can still see it but can no longer submit."
                onClick={() =>
                  setFormData((previous) => ({
                    ...previous,
                    status: "Closed",
                  }))
                }
              />
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM ACTIONS
      ===================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#B00000] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />

              {submitLabel}
            </>
          )}
        </button>
      </div>

      {/* =====================================================
          FORM NOTICE
      ===================================================== */}

      <div className="flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[#1E3A8A]" />

        <div>
          <p className="text-sm font-semibold text-[#1E3A8A]">
            Assignment workflow
          </p>

          <p className="mt-1 text-xs leading-5 text-blue-700">
            Only students enrolled in the selected course can see a published
            assignment. Draft assignments stay hidden until you publish them.
          </p>
        </div>
      </div>
    </form>
  );
};

/* ==============================================================
   SECTION HEADER
============================================================== */

const SectionHeader = ({ icon: Icon, title, description }) => {
  return (
    <div className="border-b border-gray-100 px-5 py-4 sm:px-6">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-red-50 p-2 text-[#B00000]">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h2 className="font-semibold text-gray-900">{title}</h2>

          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

/* ==============================================================
   FORM FIELD
============================================================== */

const FormField = ({ label, required = false, error, children }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-700">
        {label}

        {required && <span className="ml-1 text-[#B00000]">*</span>}
      </label>

      {children}

      {error && (
        <p className="mt-1 text-xs font-medium text-red-600">{error}</p>
      )}
    </div>
  );
};

/* ==============================================================
   INPUT CLASS
============================================================== */

const inputClass = (error = false) =>
  `w-full rounded-lg border ${
    error
      ? "border-red-400 focus:border-red-500 focus:ring-red-100"
      : "border-gray-200 focus:border-[#B00000] focus:ring-red-100"
  } bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:ring-2`;

/* ==============================================================
   SUBMISSION OPTION
============================================================== */

const SubmissionOption = ({ value, current, title, description, onClick }) => {
  const selected = value === current;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#B00000] bg-red-50 ring-1 ring-[#B00000]"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${
            selected ? "border-[#B00000] bg-[#B00000]" : "border-gray-300"
          }`}
        >
          {selected && (
            <div className="flex h-full items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-gray-900">{title}</p>

          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
};

/* ==============================================================
   STATUS OPTION
============================================================== */

const StatusOption = ({ value, current, title, description, onClick }) => {
  const selected = value === current;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-xl border p-4 text-left transition ${
        selected
          ? "border-[#B00000] bg-red-50 ring-1 ring-[#B00000]"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${
            selected ? "border-[#B00000] bg-[#B00000]" : "border-gray-300"
          }`}
        >
          {selected && (
            <div className="flex h-full items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white" />
            </div>
          )}
        </div>

        <div>
          <p className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
            {value === "Closed" && <Lock className="h-3.5 w-3.5" />}
            {title}
          </p>

          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </button>
  );
};

export default AssignmentForm;
