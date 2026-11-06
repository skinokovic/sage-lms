import { useEffect, useMemo, useState } from "react";

import {
  AlertCircle,
  Ban,
  CalendarDays,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Monitor,
  Users,
  Video,
  X,
} from "lucide-react";

import { courseApi } from "../../api/courseApi";
import { lagosToIso, toLagosParts } from "../../utils/scheduleFormat";

const INITIAL_FORM = {
  title: "",
  course: "",
  sessionType: "Live Class",
  date: "",
  startTime: "",
  endTime: "",
  deliveryMode: "Online",
  location: "",
  description: "",
  meetingLink: "",
  cancelled: false,
};

const SESSION_TYPES = [
  "Live Class",
  "Practical",
  "Office Hours",
  "Seminar",
  "Review",
];

const ScheduleForm = ({
  initialData = null,
  submitLabel = "Create Schedule",
  onSubmit,
  onCancel,
}) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initialData);

  useEffect(() => {
    if (!initialData) {
      setForm(INITIAL_FORM);
      return;
    }

    setForm({
      ...INITIAL_FORM,
      ...initialData,
    });
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

  // Archived courses can't get new sessions, unless this one already uses it
  const courseOptions = useMemo(
    () =>
      courses.filter(
        (course) => course.status !== "Archived" || course.id === form.course,
      ),
    [courses, form.course],
  );

  const selectedCourse = courses.find((course) => course.id === form.course);
  const enrolledStudents = selectedCourse?.students ?? 0;

  const today = toLagosParts(new Date().toISOString()).date;

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [field]: "",
    }));
  };

  const validate = () => {
    const nextErrors = {};

    if (!form.title.trim()) {
      nextErrors.title = "Schedule title is required.";
    }

    if (!form.course) {
      nextErrors.course = "Please select a course.";
    }

    if (!form.date) {
      nextErrors.date = "Please select a date.";
    }

    if (!form.startTime) {
      nextErrors.startTime = "Start time is required.";
    }

    if (!form.endTime) {
      nextErrors.endTime = "End time is required.";
    }

    if (form.startTime && form.endTime && form.endTime <= form.startTime) {
      nextErrors.endTime = "End time must be after the start time.";
    }

    if (form.deliveryMode === "Physical" && !form.location.trim()) {
      nextErrors.location = "Location is required for physical sessions.";
    }

    if (form.deliveryMode === "Online") {
      if (!form.meetingLink.trim()) {
        nextErrors.meetingLink =
          "Meeting link is required for online sessions.";
      } else if (!/^https?:\/\/\S+$/i.test(form.meetingLink.trim())) {
        nextErrors.meetingLink =
          "Enter a valid link starting with http:// or https://";
      }
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting || !validate()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit?.({
        title: form.title.trim(),
        course: form.course,
        type: form.sessionType,
        mode: form.deliveryMode,
        location: form.location.trim(),
        meetingLink: form.meetingLink.trim(),
        startsAt: lagosToIso(form.date, form.startTime),
        endsAt: lagosToIso(form.date, form.endTime),
        description: form.description.trim(),
        ...(isEditing ? { cancelled: form.cancelled } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = (field) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 ${
      errors[field] ? "border-red-400" : "border-gray-200"
    }`;

  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =====================================================
          BASIC INFORMATION
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B00000]/10 text-[#B00000]">
            <FileText size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">
              Schedule Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Enter the basic details for this teaching session.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* Title */}

          <div>
            <label className={labelClass}>
              Schedule Title <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={form.title}
              maxLength={150}
              onChange={(event) => handleChange("title", event.target.value)}
              placeholder="e.g. Introduction to PID Control"
              className={inputClass("title")}
            />

            {errors.title && (
              <p className="mt-2 text-xs text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Course */}

          <div>
            <label className={labelClass}>
              Course <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <GraduationCap
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <select
                value={form.course}
                disabled={coursesLoading}
                onChange={(event) => handleChange("course", event.target.value)}
                className={`${inputClass(
                  "course",
                )} cursor-pointer appearance-none pl-11 pr-10`}
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
            </div>

            {errors.course && (
              <p className="mt-2 text-xs text-red-600">{errors.course}</p>
            )}

            {!coursesLoading && courses.length === 0 && (
              <p className="mt-2 text-xs text-amber-700">
                You don't have any courses yet. Create a course first.
              </p>
            )}
          </div>

          {/* Session Type */}

          <div>
            <label className={labelClass}>Session Type</label>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {SESSION_TYPES.map((type) => {
                const active = form.sessionType === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChange("sessionType", type)}
                    className={`cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold transition ${
                      active
                        ? "border-[#B00000] bg-red-50 text-[#B00000]"
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          DATE & TIME
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <CalendarDays size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">Date & Time</h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose when the session will take place (Nigerian time, WAT).
            </p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-3">
          {/* Date */}

          <div>
            <label className={labelClass}>
              Date <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <CalendarDays
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="date"
                value={form.date}
                min={isEditing ? undefined : today}
                onChange={(event) => handleChange("date", event.target.value)}
                className={`${inputClass("date")} pl-11`}
              />
            </div>

            {errors.date && (
              <p className="mt-2 text-xs text-red-600">{errors.date}</p>
            )}
          </div>

          {/* Start */}

          <div>
            <label className={labelClass}>
              Start Time <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Clock3
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="time"
                value={form.startTime}
                onChange={(event) =>
                  handleChange("startTime", event.target.value)
                }
                className={`${inputClass("startTime")} pl-11`}
              />
            </div>

            {errors.startTime && (
              <p className="mt-2 text-xs text-red-600">{errors.startTime}</p>
            )}
          </div>

          {/* End */}

          <div>
            <label className={labelClass}>
              End Time <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <Clock3
                size={18}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="time"
                value={form.endTime}
                onChange={(event) =>
                  handleChange("endTime", event.target.value)
                }
                className={`${inputClass("endTime")} pl-11`}
              />
            </div>

            {errors.endTime && (
              <p className="mt-2 text-xs text-red-600">{errors.endTime}</p>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          DELIVERY
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <Monitor size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">
              Delivery Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Choose how students will attend the session.
            </p>
          </div>
        </div>

        <div className="mt-6">
          <label className={labelClass}>Delivery Mode</label>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Online */}

            <button
              type="button"
              onClick={() => handleChange("deliveryMode", "Online")}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition ${
                form.deliveryMode === "Online"
                  ? "border-[#1E3A8A] bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  form.deliveryMode === "Online"
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <Video size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">Online</p>

                <p className="mt-1 text-xs text-gray-500">
                  Virtual classroom or video meeting
                </p>
              </div>
            </button>

            {/* Physical */}

            <button
              type="button"
              onClick={() => handleChange("deliveryMode", "Physical")}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-left transition ${
                form.deliveryMode === "Physical"
                  ? "border-[#1E3A8A] bg-blue-50"
                  : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                  form.deliveryMode === "Physical"
                    ? "bg-[#1E3A8A] text-white"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <MapPin size={20} />
              </div>

              <div>
                <p className="text-sm font-bold text-gray-900">Physical</p>

                <p className="mt-1 text-xs text-gray-500">
                  Classroom, laboratory or lecture hall
                </p>
              </div>
            </button>
          </div>

          <div className="mt-5">
            {form.deliveryMode === "Online" ? (
              <div>
                <label className={labelClass}>
                  Meeting Link <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Video
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="url"
                    value={form.meetingLink}
                    onChange={(event) =>
                      handleChange("meetingLink", event.target.value)
                    }
                    placeholder="https://meet.google.com/..."
                    className={`${inputClass("meetingLink")} pl-11`}
                  />
                </div>

                {errors.meetingLink && (
                  <p className="mt-2 text-xs text-red-600">
                    {errors.meetingLink}
                  </p>
                )}
              </div>
            ) : (
              <div>
                <label className={labelClass}>
                  Location <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type="text"
                    value={form.location}
                    maxLength={150}
                    onChange={(event) =>
                      handleChange("location", event.target.value)
                    }
                    placeholder="e.g. Automation Lab"
                    className={`${inputClass("location")} pl-11`}
                  />
                </div>

                {errors.location && (
                  <p className="mt-2 text-xs text-red-600">{errors.location}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          STUDENTS & DESCRIPTION
      ====================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
            <Users size={20} />
          </div>

          <div>
            <h2 className="text-base font-bold text-gray-900">
              Attendance & Description
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              See who will be invited and provide additional information.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-5">
          {/* Students */}

          <div>
            <label className={labelClass}>Students Invited</label>

            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <Users size={18} className="shrink-0 text-gray-400" />

              <span className="text-sm font-semibold text-gray-800">
                {form.course
                  ? `${enrolledStudents} ${
                      enrolledStudents === 1 ? "student" : "students"
                    } enrolled`
                  : "Select a course to see the number of students"}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-400">
              Every student enrolled in the selected course can see this
              session.
            </p>
          </div>

          {/* Description */}

          <div>
            <label className={labelClass}>Session Description</label>

            <textarea
              rows={5}
              maxLength={500}
              value={form.description}
              onChange={(event) =>
                handleChange("description", event.target.value)
              }
              placeholder="Describe what will be covered during this session..."
              className={`${inputClass("description")} resize-y`}
            />

            <div className="mt-2 flex justify-end">
              <span className="text-xs text-gray-400">
                {form.description.length}/500
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          CANCEL SESSION (editing only)
      ====================================================== */}

      {isEditing && (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={form.cancelled}
              onChange={(event) =>
                handleChange("cancelled", event.target.checked)
              }
              className="mt-1 h-4 w-4 cursor-pointer accent-[#B00000]"
            />

            <span className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
                <Ban size={20} />
              </span>

              <span>
                <span className="block text-base font-bold text-gray-900">
                  Cancel this session
                </span>

                <span className="mt-1 block text-sm text-gray-500">
                  Cancelled sessions are hidden from students.
                </span>
              </span>
            </span>
          </label>
        </section>
      )}

      {Object.values(errors).some(Boolean) && (
        <div className="flex items-start gap-2 rounded-xl bg-red-50 p-4 text-sm text-[#B00000]">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          Please fix the highlighted fields above.
        </div>
      )}

      {/* =====================================================
          ACTIONS
      ====================================================== */}

      <div className="flex flex-col-reverse gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <X size={17} />
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? (
            <Loader2 size={17} className="animate-spin" />
          ) : (
            <CalendarDays size={17} />
          )}
          {submitting ? "Saving..." : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ScheduleForm;
