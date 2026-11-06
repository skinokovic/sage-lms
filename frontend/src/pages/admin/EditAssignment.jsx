import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  ArrowLeft,
  Save,
  Send,
  Loader2,
  AlertCircle,
  BookOpen,
  User,
  FileText,
  CalendarDays,
  Clock3,
  Award,
  RotateCcw,
} from "lucide-react";

import { toast } from "react-toastify";

import { fetchAssignment, updateAssignment } from "../../store/assignmentSlice";

import { fetchInstructors } from "../../store/instructorSlice";

import axiosClient from "../../api/axiosClient";

const getCourseId = (course) => {
  if (!course) return "";

  if (typeof course === "string") {
    return course;
  }

  return course.id || course._id || "";
};

const getInstructorId = (instructor) => {
  if (!instructor) return "";

  if (typeof instructor === "string") {
    return instructor;
  }

  return (
    instructor.user?._id ||
    instructor.user?.id ||
    instructor.userId ||
    instructor.id ||
    instructor._id ||
    ""
  );
};

const toDateInputValue = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const toTimeInputValue = (date) => {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const hours = String(parsed.getHours()).padStart(2, "0");

  const minutes = String(parsed.getMinutes()).padStart(2, "0");

  return `${hours}:${minutes}`;
};

const EditAssignment = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id } = useParams();

  const { selectedAssignment, actionStatus, error } = useSelector(
    (state) => state.assignments,
  );

  const { instructors, status: instructorsStatus } = useSelector(
    (state) => state.instructors,
  );

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    course: "",
    instructor: "",
    type: "Assignment",
    description: "",
    instructions: "",
    points: "100",
    passingPoints: "50",
    dueDate: "",
    dueTime: "",
    submissionType: "File Upload",
    attachmentRequired: false,
    allowedAttempts: "1",
    status: "Draft",
  });

  const [errors, setErrors] = useState({});
  const [initialized, setInitialized] = useState(false);

  /*
   * Load assignment
   */
  useEffect(() => {
    if (!id) return;

    dispatch(fetchAssignment(id));
  }, [dispatch, id]);

  /*
   * Load instructors
   */
  useEffect(() => {
    dispatch(fetchInstructors());
  }, [dispatch]);

  /*
   * Load courses
   */
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCoursesLoading(true);

        const response = await axiosClient.get("/courses");

        const courseData = response.data?.data || response.data?.courses || [];

        setCourses(Array.isArray(courseData) ? courseData : []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load courses");
      } finally {
        setCoursesLoading(false);
      }
    };

    loadCourses();
  }, []);

  /*
   * Fill form when assignment loads
   */
  useEffect(() => {
    if (!selectedAssignment || initialized) {
      return;
    }

    const assignment = selectedAssignment;

    const dueDate = assignment.dueDate;

    setFormData({
      title: assignment.title || "",

      course: getCourseId(assignment.course),

      instructor: getInstructorId(assignment.instructor),

      type: assignment.type || "Assignment",

      description: assignment.description || "",

      instructions: assignment.instructions || "",

      points:
        assignment.points !== undefined && assignment.points !== null
          ? String(assignment.points)
          : "100",

      passingPoints:
        assignment.passingScore !== undefined &&
        assignment.passingScore !== null
          ? String(assignment.passingScore)
          : "50",

      dueDate: toDateInputValue(dueDate),

      dueTime: toTimeInputValue(dueDate),

      /*
       * submissionType is not currently persisted by
       * the Assignment model.
       *
       * Keep the UI value so the edit page remains
       * compatible with the existing CreateAssignment UI.
       */
      submissionType: "File Upload",

      allowedAttempts:
        assignment.maxAttempts !== undefined && assignment.maxAttempts !== null
          ? String(assignment.maxAttempts)
          : "1",

      status: assignment.status || "Draft",
    });

    setInitialized(true);
  }, [selectedAssignment, initialized]);

  /*
   * Handle Redux errors
   */
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validate = () => {
    const validationErrors = {};

    if (!formData.title.trim()) {
      validationErrors.title = "Assignment title is required";
    }

    if (!formData.course) {
      validationErrors.course = "Please select a course";
    }

    if (!formData.instructor) {
      validationErrors.instructor = "Please select an instructor";
    }

    if (!formData.description.trim()) {
      validationErrors.description = "Description is required";
    }

    if (!formData.dueDate) {
      validationErrors.dueDate = "Due date is required";
    }

    const points = Number(formData.points);
    const passingPoints = Number(formData.passingPoints);
    const attempts = Number(formData.allowedAttempts);

    if (!Number.isFinite(points) || points <= 0) {
      validationErrors.points = "Points must be greater than 0";
    }

    if (!Number.isFinite(passingPoints) || passingPoints < 0) {
      validationErrors.passingPoints = "Passing score cannot be negative";
    }

    if (
      Number.isFinite(points) &&
      Number.isFinite(passingPoints) &&
      passingPoints > points
    ) {
      validationErrors.passingPoints =
        "Passing score cannot exceed total points";
    }

    if (!Number.isFinite(attempts) || attempts < 1) {
      validationErrors.allowedAttempts = "Attempts must be at least 1";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (event, requestedStatus = formData.status) => {
    event?.preventDefault();

    if (!validate()) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    if (!id) {
      toast.error("Assignment ID is missing");
      return;
    }

    const dueDate = formData.dueDate
      ? formData.dueTime
        ? `${formData.dueDate}T${formData.dueTime}`
        : `${formData.dueDate}T23:59:00`
      : null;

    const payload = {
      title: formData.title.trim(),

      description: formData.description.trim(),

      instructions: formData.instructions.trim(),

      course: formData.course,

      instructor: formData.instructor,

      type: formData.type === "Case Study" ? "Assignment" : formData.type,

      points: Number(formData.points),

      passingScore: Number(formData.passingPoints),

      dueDate,

      status: requestedStatus,

      submissionType: formData.submissionType,
      attachmentRequired: formData.attachmentRequired,

      maxAttempts: Number(formData.allowedAttempts),

      allowLateSubmission: true,
    };

    try {
      const result = await dispatch(
        updateAssignment({
          id,
          payload,
        }),
      ).unwrap();

      toast.success(
        requestedStatus === "Published"
          ? "Assignment updated and published successfully"
          : "Assignment updated successfully",
      );

      /*
       * Keep the user on the details page after saving.
       */
      navigate(`/dashboard/admin/assignments/${result.id || id}`);
    } catch (error) {
      toast.error(error || "Failed to update assignment");
    }
  };

  const handleReset = () => {
    if (!selectedAssignment) return;

    const assignment = selectedAssignment;

    setFormData({
      title: assignment.title || "",

      course: getCourseId(assignment.course),

      instructor: getInstructorId(assignment.instructor),

      type: assignment.type || "Assignment",

      description: assignment.description || "",

      instructions: assignment.instructions || "",

      points:
        assignment.points !== undefined && assignment.points !== null
          ? String(assignment.points)
          : "100",

      passingPoints:
        assignment.passingScore !== undefined &&
        assignment.passingScore !== null
          ? String(assignment.passingScore)
          : "50",

      dueDate: toDateInputValue(assignment.dueDate),

      dueTime: toTimeInputValue(assignment.dueDate),

      submissionType: "File Upload",
      attachmentRequired: assignment.attachmentRequired ?? false,
      allowedAttempts:
        assignment.maxAttempts !== undefined && assignment.maxAttempts !== null
          ? String(assignment.maxAttempts)
          : "1",

      status: assignment.status || "Draft",
    });

    setErrors({});
  };

  if (actionStatus === "loading" && !selectedAssignment) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="h-8 w-8 animate-spin text-[#B00000]" />

          <p className="text-sm">Loading assignment...</p>
        </div>
      </div>
    );
  }

  if (!selectedAssignment) {
    return (
      <div className="p-4 sm:p-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/assignments")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </button>

        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />

          <h2 className="mt-4 text-lg font-semibold text-gray-900">
            Assignment not found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            The assignment could not be loaded.
          </p>
        </div>
      </div>
    );
  }

  const isSaving = actionStatus === "loading";

  return (
    <div className="p-4 sm:p-6">
      <form
        onSubmit={(event) => handleSubmit(event, formData.status)}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate(`/dashboard/admin/assignments/${id}`)}
              className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#B00000]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Assignment
            </button>

            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Edit Assignment
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Update the assignment details and save your changes.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleReset}
              disabled={isSaving}
              className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Basic information */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#B00000]" />

              <h2 className="text-lg font-semibold text-gray-900">
                Basic Information
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 lg:grid-cols-2">
            {/* Title */}
            <div className="lg:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assignment Title
              </label>

              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter assignment title"
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.title ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.title && (
                <p className="mt-1 text-xs text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Course */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Course
              </label>

              <div className="relative">
                <BookOpen className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  disabled={coursesLoading}
                  className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                    errors.course ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {coursesLoading ? "Loading courses..." : "Select course"}
                  </option>

                  {courses.map((course) => {
                    const courseId = course.id || course._id;

                    return (
                      <option key={courseId} value={courseId}>
                        {course.title}
                      </option>
                    );
                  })}
                </select>
              </div>

              {errors.course && (
                <p className="mt-1 text-xs text-red-600">{errors.course}</p>
              )}
            </div>

            {/* Instructor */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Instructor
              </label>

              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <select
                  name="instructor"
                  value={formData.instructor}
                  onChange={handleChange}
                  disabled={instructorsStatus === "loading"}
                  className={`w-full appearance-none rounded-lg border bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                    errors.instructor ? "border-red-500" : "border-gray-200"
                  }`}
                >
                  <option value="">
                    {instructorsStatus === "loading"
                      ? "Loading instructors..."
                      : "Select instructor"}
                  </option>

                  {Array.isArray(instructors) &&
                    instructors.map((instructor) => {
                      const instructorId = getInstructorId(instructor);

                      const instructorName =
                        instructor.name ||
                        instructor.user?.name ||
                        "Unnamed Instructor";

                      return (
                        <option key={instructorId} value={instructorId}>
                          {instructorName}
                        </option>
                      );
                    })}
                </select>
              </div>

              {errors.instructor && (
                <p className="mt-1 text-xs text-red-600">{errors.instructor}</p>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Assignment Type
              </label>

              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              >
                <option value="Assignment">Assignment</option>

                <option value="Practical">Practical</option>

                <option value="Project">Project</option>

                <option value="Quiz">Quiz</option>

                <option value="Case Study">Case Study</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Status
              </label>

              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              >
                <option value="Draft">Draft</option>

                <option value="Published">Published</option>

                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Description & Instructions
            </h2>
          </div>

          <div className="space-y-5 p-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Description
              </label>

              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={5}
                placeholder="Describe what students need to complete..."
                className={`w-full resize-y rounded-lg border px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.description ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.description && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.description}
                </p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Instructions
              </label>

              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                rows={6}
                placeholder="Provide detailed instructions for students..."
                className="w-full resize-y rounded-lg border border-gray-200 px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              />
            </div>
          </div>
        </div>

        {/* Assessment settings */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-[#B00000]" />

              <h2 className="text-lg font-semibold text-gray-900">
                Assessment Settings
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Points */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Total Points
              </label>

              <input
                type="number"
                name="points"
                min="1"
                value={formData.points}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.points ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.points && (
                <p className="mt-1 text-xs text-red-600">{errors.points}</p>
              )}
            </div>

            {/* Passing */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Passing Score
              </label>

              <input
                type="number"
                name="passingPoints"
                min="0"
                value={formData.passingPoints}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.passingPoints ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.passingPoints && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.passingPoints}
                </p>
              )}
            </div>

            {/* Attempts */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Maximum Attempts
              </label>

              <input
                type="number"
                name="allowedAttempts"
                min="1"
                value={formData.allowedAttempts}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.allowedAttempts ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.allowedAttempts && (
                <p className="mt-1 text-xs text-red-600">
                  {errors.allowedAttempts}
                </p>
              )}
            </div>

            {/* Submission type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Submission Type
              </label>

              <select
                name="submissionType"
                value={formData.submissionType}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              >
                <option value="File Upload">File Upload</option>

                <option value="Text Submission">Text Submission</option>

                <option value="Both">Both</option>
              </select>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Attachment Required
                </label>

                <select
                  name="attachmentRequired"
                  value={formData.attachmentRequired ? "true" : "false"}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      attachmentRequired: e.target.value === "true",
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-[#B00000]"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              {/* <p className="mt-1 text-xs text-gray-400">
                Currently retained for UI compatibility.
              </p> */}
            </div>
          </div>
        </div>

        {/* Due date */}
        <div className="rounded-xl border border-gray-200 bg-white">
          <div className="border-b border-gray-200 px-5 py-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-[#B00000]" />

              <h2 className="text-lg font-semibold text-gray-900">
                Due Date & Time
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Due Date
              </label>

              <input
                type="date"
                name="dueDate"
                value={formData.dueDate}
                onChange={handleChange}
                className={`w-full rounded-lg border px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100 ${
                  errors.dueDate ? "border-red-500" : "border-gray-200"
                }`}
              />

              {errors.dueDate && (
                <p className="mt-1 text-xs text-red-600">{errors.dueDate}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Due Time
              </label>

              <div className="relative">
                <Clock3 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                <input
                  type="time"
                  name="dueTime"
                  value={formData.dueTime}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/admin/assignments/${id}`)}
            disabled={isSaving}
            className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              disabled={isSaving}
              onClick={(event) => handleSubmit(event, "Draft")}
              className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save as Draft
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={(event) => handleSubmit(event, "Published")}
              className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-lg bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Save & Publish
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditAssignment;
