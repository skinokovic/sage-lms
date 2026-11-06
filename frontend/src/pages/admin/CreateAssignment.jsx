import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  FileText,
  GraduationCap,
  Save,
  Send,
  Upload,
  Users,
  X,
} from "lucide-react";

import { toast } from "react-toastify";

import { createAssignment } from "../../store/assignmentSlice";
import { fetchInstructors } from "../../store/instructorSlice";
import axiosClient from "../../api/axiosClient";

const CreateAssignment = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { instructors, status: instructorStatus } = useSelector(
    (state) => state.instructors,
  );

  const { actionStatus, error: assignmentError } = useSelector(
    (state) => state.assignments,
  );

  const [courses, setCourses] = useState([]);
  const [courseStatus, setCourseStatus] = useState("idle");

  const [isSaving, setIsSaving] = useState(false);

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

  /*
   * ==========================================================
   * LOAD COURSES
   * ==========================================================
   *
   * Courses are now loaded from MongoDB instead of the old
   * hard-coded course list.
   */
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setCourseStatus("loading");

        const response = await axiosClient.get("/courses");

        const courseData = response.data?.data || response.data?.courses || [];

        setCourses(Array.isArray(courseData) ? courseData : []);
        setCourseStatus("succeeded");
      } catch (error) {
        console.error("Failed to load courses:", error);

        setCourses([]);
        setCourseStatus("failed");

        toast.error(error.response?.data?.message || "Failed to load courses.");
      }
    };

    loadCourses();
  }, []);

  /*
   * ==========================================================
   * LOAD INSTRUCTORS
   * ==========================================================
   *
   * Uses the existing instructor Redux integration.
   */
  useEffect(() => {
    if (instructorStatus === "idle") {
      dispatch(fetchInstructors());
    }
  }, [dispatch, instructorStatus]);

  /*
   * ==========================================================
   * SHOW REDUX ERRORS
   * ==========================================================
   */
  useEffect(() => {
    if (assignmentError) {
      toast.error(assignmentError);
    }
  }, [assignmentError]);

  /*
   * ==========================================================
   * FORM CHANGE
   * ==========================================================
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  /*
   * ==========================================================
   * VALIDATION
   * ==========================================================
   */
  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error("Please enter an assignment title.");
      return false;
    }

    if (!formData.course) {
      toast.error("Please select a course.");
      return false;
    }

    if (!formData.instructor) {
      toast.error("Please select an instructor.");
      return false;
    }

    if (!formData.description.trim()) {
      toast.error("Please enter an assignment description.");
      return false;
    }

    if (!formData.dueDate) {
      toast.error("Please select a due date.");
      return false;
    }

    if (!formData.points || Number(formData.points) <= 0) {
      toast.error("Maximum points must be greater than 0.");
      return false;
    }

    if (formData.passingPoints === "" || Number(formData.passingPoints) < 0) {
      toast.error("Please enter valid passing points.");
      return false;
    }

    if (Number(formData.passingPoints) > Number(formData.points)) {
      toast.error("Passing points cannot exceed maximum points.");
      return false;
    }

    if (!formData.allowedAttempts || Number(formData.allowedAttempts) < 1) {
      toast.error("Allowed attempts must be at least 1.");
      return false;
    }

    return true;
  };

  /*
   * ==========================================================
   * CREATE ASSIGNMENT
   * ==========================================================
   */
  const createNewAssignment = async (status) => {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);

    try {
      /*
       * The backend expects a MongoDB Course ObjectId.
       *
       * We therefore send formData.course directly because the
       * select below stores the course ID as its value.
       */
      const payload = {
        title: formData.title.trim(),

        description: formData.description.trim(),

        instructions: formData.instructions.trim(),

        course: formData.course,

        instructor: formData.instructor,

        type: formData.type === "Case Study" ? "Assignment" : formData.type,
        attachmentRequired: formData.attachmentRequired,

        points: Number(formData.points),

        passingScore: Number(formData.passingPoints),

        dueDate: formData.dueDate
          ? formData.dueTime
            ? `${formData.dueDate}T${formData.dueTime}`
            : `${formData.dueDate}T23:59:00`
          : null,

        status,

        /*
         * The current Assignment model does not have a
         * submissionType field, so we intentionally do not
         * send it to avoid pretending it is persisted.
         */

        maxAttempts: Number(formData.allowedAttempts),

        /*
         * These fields are supported by the Assignment model.
         */
        allowLateSubmission: true,
      };

      await dispatch(createAssignment(payload)).unwrap();

      toast.success(
        status === "Published"
          ? "Assignment published successfully."
          : "Assignment saved as draft successfully.",
      );

      navigate("/dashboard/admin/assignments");
    } catch (error) {
      console.error("Create assignment error:", error);

      toast.error(
        typeof error === "string"
          ? error
          : error?.message || "Failed to create assignment.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  /*
   * ==========================================================
   * FORM SUBMIT
   * ==========================================================
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    createNewAssignment(formData.status);
  };

  /*
   * ==========================================================
   * SAVE DRAFT
   * ==========================================================
   */
  const handleSaveDraft = () => {
    createNewAssignment("Draft");
  };

  /*
   * ==========================================================
   * PUBLISH
   * ==========================================================
   */
  const handlePublish = () => {
    createNewAssignment("Published");
  };

  /*
   * ==========================================================
   * INSTRUCTOR NORMALIZATION
   * ==========================================================
   *
   * Instructor API returns instructor records containing the
   * associated User object.
   *
   * This helper makes the UI work whether the backend returns:
   *
   * {
   *   id,
   *   user: {
   *     id,
   *     name
   *   }
   * }
   *
   * or:
   *
   * {
   *   id,
   *   name
   * }
   */
  const getInstructorId = (instructor) => {
    return (
      instructor?.user?.id ||
      instructor?.user?._id ||
      instructor?.id ||
      instructor?._id ||
      ""
    );
  };

  const getInstructorName = (instructor) => {
    return instructor?.user?.name || instructor?.name || "Unnamed Instructor";
  };

  /*
   * ==========================================================
   * COURSE NORMALIZATION
   * ==========================================================
   */
  const getCourseId = (course) => {
    return course?.id || course?._id || "";
  };

  const getCourseTitle = (course) => {
    return course?.title || "Untitled Course";
  };

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* -------------------------------------------------
          PAGE HEADER
      -------------------------------------------------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/assignments")}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#B00000]"
          >
            <ArrowLeft size={17} />
            Back to Assignments
          </button>

          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A]">
              <ClipboardList size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Create Assignment
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                Create an assignment for students and configure its submission
                and grading settings.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* -------------------------------------------------
          FORM
      -------------------------------------------------- */}
      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 lg:grid-cols-3">
          {/* =================================================
              LEFT / MAIN FORM
          ================================================== */}
          <div className="space-y-6 lg:col-span-2">
            {/* BASIC INFORMATION */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-blue-50 p-2 text-[#1E3A8A]">
                    <FileText size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">
                      Basic Information
                    </h2>

                    <p className="text-xs text-gray-500">
                      Enter the main details for this assignment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5 sm:p-6">
                {/* TITLE */}
                <div>
                  <label
                    htmlFor="title"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Assignment Title
                    <span className="ml-1 text-[#B00000]">*</span>
                  </label>

                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Build a Responsive Landing Page"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>

                {/* COURSE + INSTRUCTOR */}
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="course"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Course
                      <span className="ml-1 text-[#B00000]">*</span>
                    </label>

                    <select
                      id="course"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      disabled={courseStatus === "loading"}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                      <option value="">
                        {courseStatus === "loading"
                          ? "Loading courses..."
                          : "Select course"}
                      </option>

                      {courses.map((course) => {
                        const courseId = getCourseId(course);

                        return (
                          <option key={courseId} value={courseId}>
                            {getCourseTitle(course)}
                          </option>
                        );
                      })}
                    </select>

                    {courseStatus === "failed" && (
                      <p className="mt-1.5 text-xs text-red-500">
                        Unable to load courses.
                      </p>
                    )}

                    {courseStatus === "succeeded" && courses.length === 0 && (
                      <p className="mt-1.5 text-xs text-gray-400">
                        No courses are currently available.
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="instructor"
                      className="mb-2 block text-sm font-medium text-gray-700"
                    >
                      Instructor
                      <span className="ml-1 text-[#B00000]">*</span>
                    </label>

                    <select
                      id="instructor"
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleChange}
                      disabled={instructorStatus === "loading"}
                      className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    >
                      <option value="">
                        {instructorStatus === "loading"
                          ? "Loading instructors..."
                          : "Select instructor"}
                      </option>

                      {instructors.map((instructor) => {
                        const instructorId = getInstructorId(instructor);

                        return (
                          <option key={instructorId} value={instructorId}>
                            {getInstructorName(instructor)}
                          </option>
                        );
                      })}
                    </select>

                    {instructorStatus === "failed" && (
                      <p className="mt-1.5 text-xs text-red-500">
                        Unable to load instructors.
                      </p>
                    )}

                    {instructorStatus === "succeeded" &&
                      instructors.length === 0 && (
                        <p className="mt-1.5 text-xs text-gray-400">
                          No instructors are currently available.
                        </p>
                      )}
                  </div>
                </div>

                {/* TYPE */}
                <div>
                  <label
                    htmlFor="type"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Assignment Type
                  </label>

                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  >
                    <option value="Assignment">Assignment</option>
                    <option value="Project">Project</option>
                    <option value="Case Study">Case Study</option>
                  </select>
                </div>

                {/* DESCRIPTION */}
                <div>
                  <label
                    htmlFor="description"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Description
                    <span className="ml-1 text-[#B00000]">*</span>
                  </label>

                  <textarea
                    id="description"
                    name="description"
                    rows={5}
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe what students are expected to complete..."
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />

                  <p className="mt-1.5 text-xs text-gray-400">
                    Give students a clear overview of the task.
                  </p>
                </div>

                {/* INSTRUCTIONS */}
                <div>
                  <label
                    htmlFor="instructions"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Instructions
                  </label>

                  <textarea
                    id="instructions"
                    name="instructions"
                    rows={6}
                    value={formData.instructions}
                    onChange={handleChange}
                    placeholder="Provide detailed instructions, requirements, submission guidelines, etc."
                    className="w-full resize-none rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>
              </div>
            </section>

            {/* DEADLINE */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-orange-50 p-2 text-orange-600">
                    <CalendarDays size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">Deadline</h2>

                    <p className="text-xs text-gray-500">
                      Set when students must submit the assignment.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {/* DATE */}
                <div>
                  <label
                    htmlFor="dueDate"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Due Date
                    <span className="ml-1 text-[#B00000]">*</span>
                  </label>

                  <input
                    id="dueDate"
                    name="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>

                {/* TIME */}
                <div>
                  <label
                    htmlFor="dueTime"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Due Time
                  </label>

                  <input
                    id="dueTime"
                    name="dueTime"
                    type="time"
                    value={formData.dueTime}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>
              </div>
            </section>

            {/* GRADING */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-green-50 p-2 text-green-600">
                    <GraduationCap size={19} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">Grading</h2>

                    <p className="text-xs text-gray-500">
                      Configure the grading requirements.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {/* MAX POINTS */}
                <div>
                  <label
                    htmlFor="points"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Maximum Points
                    <span className="ml-1 text-[#B00000]">*</span>
                  </label>

                  <input
                    id="points"
                    name="points"
                    type="number"
                    min="1"
                    value={formData.points}
                    onChange={handleChange}
                    placeholder="100"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>

                {/* PASSING */}
                <div>
                  <label
                    htmlFor="passingPoints"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Passing Points
                    <span className="ml-1 text-[#B00000]">*</span>
                  </label>

                  <input
                    id="passingPoints"
                    name="passingPoints"
                    type="number"
                    min="0"
                    value={formData.passingPoints}
                    onChange={handleChange}
                    placeholder="50"
                    className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  />
                </div>
              </div>
            </section>
          </div>

          {/* =================================================
              RIGHT SIDEBAR
          ================================================== */}
          <div className="space-y-6">
            {/* SUBMISSION SETTINGS */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple-50 p-2 text-purple-600">
                    <Upload size={18} />
                  </div>

                  <div>
                    <h2 className="font-semibold text-gray-900">Submission</h2>

                    <p className="text-xs text-gray-500">
                      Student submission settings.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-5 p-5">
                {/* SUBMISSION TYPE */}
                <div>
                  <label
                    htmlFor="submissionType"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Submission Type
                  </label>

                  <select
                    id="submissionType"
                    name="submissionType"
                    value={formData.submissionType}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  >
                    <option value="File Upload">File Upload</option>
                    <option value="Text">Text Submission</option>
                    <option value="Link">External Link</option>
                    <option value="File and Text">File & Text</option>
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

                  <p className="mt-1.5 text-xs text-gray-400">
                    Submission type will be used by the student submission
                    workflow.
                  </p>
                </div>

                {/* ATTEMPTS */}
                <div>
                  <label
                    htmlFor="allowedAttempts"
                    className="mb-2 block text-sm font-medium text-gray-700"
                  >
                    Allowed Attempts
                  </label>

                  <select
                    id="allowedAttempts"
                    name="allowedAttempts"
                    value={formData.allowedAttempts}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                  >
                    <option value="1">1 Attempt</option>
                    <option value="2">2 Attempts</option>
                    <option value="3">3 Attempts</option>
                    <option value="5">5 Attempts</option>
                  </select>
                </div>
              </div>
            </section>

            {/* STATUS */}
            <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-5 py-4">
                <h2 className="font-semibold text-gray-900">Publishing</h2>

                <p className="mt-1 text-xs text-gray-500">
                  Choose how this assignment should be saved.
                </p>
              </div>

              <div className="space-y-3 p-5">
                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    formData.status === "Draft"
                      ? "border-yellow-300 bg-yellow-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="Draft"
                    checked={formData.status === "Draft"}
                    onChange={handleChange}
                    className="mt-1 accent-yellow-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Save as Draft
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Students will not see this assignment yet.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    formData.status === "Published"
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="status"
                    value="Published"
                    checked={formData.status === "Published"}
                    onChange={handleChange}
                    className="mt-1 accent-green-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      Publish
                    </p>

                    <p className="mt-0.5 text-xs text-gray-500">
                      Students will be able to access it.
                    </p>
                  </div>
                </label>
              </div>
            </section>

            {/* INFORMATION PANEL */}
            <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
              <div className="flex gap-3">
                <Users size={20} className="mt-0.5 shrink-0 text-[#1E3A8A]" />

                <div>
                  <h3 className="text-sm font-semibold text-[#1E3A8A]">
                    Assignment Information
                  </h3>

                  <p className="mt-2 text-xs leading-5 text-blue-800/80">
                    New assignments start with zero submissions and graded
                    submissions. These values will increase as students submit
                    their work.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* -------------------------------------------------
            ACTION BAR
        -------------------------------------------------- */}
        <div className="mt-6 flex flex-col-reverse gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/assignments")}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X size={17} />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-yellow-300 bg-yellow-50 px-5 py-2.5 text-sm font-semibold text-yellow-700 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save size={17} />
            {isSaving ? "Saving..." : "Save Draft"}
          </button>

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send size={17} />
            {isSaving ? "Publishing..." : "Create & Publish"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAssignment;
