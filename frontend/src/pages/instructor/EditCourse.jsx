import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers3,
  Loader2,
  Save,
  Settings2,
  Users,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { courseApi } from "../../api/courseApi";

// Same options as the Create Course form.
const COURSE_CATEGORIES = [
  "Industrial Automation",
  "Process Control",
  "Instrumentation",
  "PLC Programming",
  "SCADA & HMI",
  "DCS",
  "Safety Instrumented Systems",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Information Technology",
];

const COURSE_LEVELS = ["Beginner", "Intermediate", "Advanced", "All Levels"];
const COURSE_STATUSES = ["Draft", "Published", "Archived"];
const MAX_THUMBNAIL_BYTES = 5 * 1024 * 1024;

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10";

const toForm = (course) => ({
  title: course.title || "",
  shortDescription: course.shortDescription || "",
  description: course.description || "",
  category: course.category || "",
  level: course.level || "Beginner",
  duration: course.duration || "",
  language: course.language || "English",
  price: course.price ?? "",
  status: course.status || "Draft",
  objectives: course.objectives?.length ? course.objectives : [""],
  prerequisites: course.prerequisites?.length ? course.prerequisites : [""],
});

const cleanList = (items) => items.map((item) => item.trim()).filter(Boolean);

const EditCourse = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [studentCount, setStudentCount] = useState(0);
  const [form, setForm] = useState(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const objectUrlRef = useRef("");

  const releaseObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }
  };

  useEffect(() => releaseObjectUrl, []);

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await courseApi.getById(courseId);
      const loaded = data.course;

      releaseObjectUrl();
      setCourse(loaded);
      setStudentCount(data.stats?.students ?? 0);
      setForm(toForm(loaded));
      setThumbnailFile(null);
      setThumbnailPreview(loaded.thumbnail || "");
    } catch (error) {
      setLoadError(
        error.response?.data?.message ||
          "Couldn't load this course. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadCourse();
  }, [loadCourse]);

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const handleListChange = (field, index, value) => {
    setForm((previous) => {
      const next = [...previous[field]];
      next[index] = value;
      return { ...previous, [field]: next };
    });
  };

  const addListItem = (field) => {
    setForm((previous) => ({ ...previous, [field]: [...previous[field], ""] }));
  };

  const removeListItem = (field, index) => {
    setForm((previous) => {
      if (previous[field].length === 1) {
        return { ...previous, [field]: [""] };
      }
      return {
        ...previous,
        [field]: previous[field].filter((_, itemIndex) => itemIndex !== index),
      };
    });
  };

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > MAX_THUMBNAIL_BYTES) {
      toast.error("Thumbnail image must be smaller than 5MB.");
      return;
    }

    releaseObjectUrl();
    objectUrlRef.current = URL.createObjectURL(file);
    setThumbnailFile(file);
    setThumbnailPreview(objectUrlRef.current);
  };

  const validate = () => {
    if (form.title.trim().length < 5) {
      toast.error("Course title must be at least 5 characters.");
      return false;
    }

    if (!form.description.trim()) {
      toast.error("Course description is required.");
      return false;
    }

    if (!form.category.trim()) {
      toast.error("Please select a category.");
      return false;
    }

    if (!form.duration.trim()) {
      toast.error("Course duration is required.");
      return false;
    }

    if (form.price === "" || Number(form.price) < 0) {
      toast.error("Enter a valid course price.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (saving || !validate()) return;

    setSaving(true);

    try {
      // Curriculum (modules) is edited in the Course Builder, so it is
      // deliberately not sent here and can't be overwritten by this page.
      const { data } = await courseApi.update(courseId, {
        title: form.title.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        level: form.level,
        duration: form.duration.trim(),
        language: form.language.trim() || "English",
        price: Number(form.price),
        status: form.status,
        objectives: cleanList(form.objectives),
        prerequisites: cleanList(form.prerequisites),
      });

      let updated = data.course;
      let thumbnailFailed = false;

      if (thumbnailFile) {
        try {
          const response = await courseApi.uploadThumbnail(
            courseId,
            thumbnailFile,
          );
          updated = response.data.course || updated;
          setThumbnailFile(null);
          releaseObjectUrl();
          setThumbnailPreview(updated.thumbnail || "");
        } catch (error) {
          thumbnailFailed = true;
          toast.warning(
            error.response?.data?.message ||
              "Your changes were saved, but the thumbnail couldn't be uploaded.",
          );
        }
      }

      setCourse(updated);
      setForm(toForm(updated));

      if (!thumbnailFailed) {
        toast.success("Course changes saved successfully.");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't save your changes.",
      );
    } finally {
      setSaving(false);
    }
  };

  const goToCourses = () => navigate("/dashboard/instructor/courses");
  const handleManageCurriculum = () =>
    navigate(`/dashboard/instructor/courses/${courseId}/builder`);
  const handlePreview = () =>
    navigate(`/dashboard/instructor/courses/${courseId}/learn`);

  /* ---------------------------------------------------------
     Loading / error states
  --------------------------------------------------------- */

  if (loading && !course) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center gap-3 px-4 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Loading course…
      </div>
    );
  }

  if (loadError || !course || !form) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <BookOpen size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Couldn't open this course
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {loadError || "We could not find this course."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadCourse}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={goToCourses}
              className="inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000]"
            >
              <ArrowLeft size={17} />
              Back to My Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------
     Derived values
  --------------------------------------------------------- */

  const modules = course.modules || [];
  const lessonCount = modules.reduce(
    (total, courseModule) => total + (courseModule.lessons?.length || 0),
    0,
  );

  const isFreeCourse =
    String(form.price).trim() !== "" && Number(form.price) === 0;

  const isDirty =
    Boolean(thumbnailFile) ||
    JSON.stringify(form) !== JSON.stringify(toForm(course));

  const categoryOptions = COURSE_CATEGORIES.includes(form.category)
    ? COURSE_CATEGORIES
    : form.category
      ? [form.category, ...COURSE_CATEGORIES]
      : COURSE_CATEGORIES;

  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={goToCourses}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#B00000]"
          >
            <ArrowLeft size={17} />
            Back to My Courses
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Edit Course
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                course.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : course.status === "Archived"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {course.status}
            </span>
            {isDirty && (
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1E3A8A]">
                Unsaved changes
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-gray-500">{course.title}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Eye size={17} />
            Preview Course
          </button>
          <button
            type="button"
            onClick={handleManageCurriculum}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#B00000]/20 bg-red-50 px-4 py-2.5 text-sm font-semibold text-[#B00000] hover:bg-red-100"
          >
            <Layers3 size={17} />
            Manage Curriculum
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={Users} label="Students" value={studentCount} />
        <SummaryCard icon={BookOpen} label="Lessons" value={lessonCount} />
        <SummaryCard
          icon={Clock3}
          label="Duration"
          value={course.duration || "—"}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Rating"
          value={course.rating ? `${course.rating}/5` : "New"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        {/* Main form */}
        <main className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Course Information</h2>
                <p className="text-sm text-gray-500">
                  Update the information students see about this course.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <Field label="Course Title" required>
                <input
                  value={form.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Enter course title"
                />
              </Field>

              <Field label="Short Description">
                <textarea
                  value={form.shortDescription}
                  onChange={(e) =>
                    handleChange("shortDescription", e.target.value)
                  }
                  rows={3}
                  maxLength={500}
                  className={`${INPUT_CLASS} resize-none`}
                  placeholder="A short overview shown on course cards..."
                />
                <span className="mt-2 block text-right text-xs text-gray-400">
                  {form.shortDescription.length}/500
                </span>
              </Field>

              <Field label="Course Description" required>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={7}
                  className={`${INPUT_CLASS} resize-y`}
                  placeholder="Describe what students will learn..."
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Category" required>
                  <select
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className={INPUT_CLASS}
                  >
                    <option value="">Select category</option>
                    {categoryOptions.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Level" required>
                  <select
                    value={form.level}
                    onChange={(e) => handleChange("level", e.target.value)}
                    className={INPUT_CLASS}
                  >
                    {COURSE_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Duration" required>
                  <input
                    value={form.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="e.g. 8 weeks"
                  />
                </Field>

                <Field label="Language">
                  <input
                    value={form.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="English"
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Objectives */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 text-green-600">
                <CheckCircle2 size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Learning Objectives</h2>
                <p className="text-sm text-gray-500">
                  What students should be able to do after completing the
                  course.
                </p>
              </div>
            </div>

            <ListField
              items={form.objectives}
              placeholder="Learning objective"
              dotClass="bg-[#B00000]"
              addLabel="+ Add another objective"
              addClass="text-[#B00000]"
              onChange={(index, value) =>
                handleListChange("objectives", index, value)
              }
              onAdd={() => addListItem("objectives")}
              onRemove={(index) => removeListItem("objectives", index)}
            />
          </section>

          {/* Prerequisites */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <FileText size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Prerequisites</h2>
                <p className="text-sm text-gray-500">
                  Anything students should know before starting this course.
                </p>
              </div>
            </div>

            <ListField
              items={form.prerequisites}
              placeholder="Prerequisite"
              dotClass="bg-[#1E3A8A]"
              addLabel="+ Add another prerequisite"
              addClass="text-[#1E3A8A]"
              onChange={(index, value) =>
                handleListChange("prerequisites", index, value)
              }
              onAdd={() => addListItem("prerequisites")}
              onRemove={(index) => removeListItem("prerequisites", index)}
            />
          </section>

          {/* Settings */}
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
                <Settings2 size={20} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Course Settings</h2>
                <p className="text-sm text-gray-500">
                  Control pricing and publication status.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div>
                <Field label="Price (NGN)" required>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.price}
                    onChange={(e) => handleChange("price", e.target.value)}
                    className={INPUT_CLASS}
                    placeholder="0"
                  />
                </Field>

                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={isFreeCourse}
                    onChange={(e) =>
                      handleChange("price", e.target.checked ? "0" : "")
                    }
                    className="h-4 w-4 rounded border-gray-300 text-[#B00000] focus:ring-[#B00000]"
                  />
                  This is a free course
                </label>

                {isFreeCourse && (
                  <p className="mt-1 text-xs text-gray-500">
                    Students enroll with one click. No payment is taken.
                  </p>
                )}
              </div>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className={INPUT_CLASS}
                >
                  {COURSE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm font-medium text-gray-700">
              {form.status === "Published" &&
                (lessonCount === 0
                  ? "This course is visible to students, but it has no lessons yet."
                  : "This course is visible to students.")}
              {form.status === "Draft" &&
                "This course is private and not visible to students."}
              {form.status === "Archived" &&
                "This course is hidden from the catalogue. Students who already enrolled keep their enrollment."}
            </div>
          </section>
        </main>

        {/* Side panel */}
        <aside className="space-y-6">
          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 p-5">
              <h2 className="font-bold text-gray-900">Course Thumbnail</h2>
              <p className="mt-1 text-sm text-gray-500">
                Add an image students will see for this course.
              </p>
            </div>

            <div className="p-5">
              <div className="aspect-video overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
                {thumbnailPreview ? (
                  <img
                    src={thumbnailPreview}
                    alt="Course thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-gray-400">
                    <ImageIcon size={30} />
                    <p className="mt-2 text-xs">No thumbnail selected</p>
                  </div>
                )}
              </div>

              <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                <ImageIcon size={17} />
                {thumbnailPreview ? "Replace Image" : "Choose Image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleThumbnailChange}
                  className="hidden"
                />
              </label>

              {thumbnailFile && (
                <p className="mt-2 text-xs text-gray-500">
                  New image selected. It uploads when you save.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
                <Layers3 size={19} />
              </div>
              <div>
                <h2 className="font-bold text-gray-900">Curriculum</h2>
                <p className="text-xs text-gray-500">
                  Manage modules and lessons
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Modules</span>
                <span className="font-bold text-gray-900">
                  {modules.length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-gray-500">Lessons</span>
                <span className="font-bold text-gray-900">{lessonCount}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleManageCurriculum}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white hover:bg-[#172f70]"
            >
              <Layers3 size={17} />
              Open Course Builder
            </button>
          </section>
        </aside>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-[#B00000]">*</span>}
    </span>
    {children}
  </label>
);

const ListField = ({
  items,
  placeholder,
  dotClass,
  addLabel,
  addClass,
  onChange,
  onAdd,
  onRemove,
}) => (
  <div>
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-2">
          <div
            className={`mt-3 flex h-2 w-2 shrink-0 rounded-full ${dotClass}`}
          />

          <input
            type="text"
            value={item}
            onChange={(event) => onChange(index, event.target.value)}
            placeholder={`${placeholder} ${index + 1}`}
            className={INPUT_CLASS}
          />

          {items.length > 1 && (
            <button
              type="button"
              onClick={() => onRemove(index)}
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              aria-label={`Remove ${placeholder.toLowerCase()}`}
            >
              <X size={18} />
            </button>
          )}
        </div>
      ))}
    </div>

    <button
      type="button"
      onClick={onAdd}
      className={`mt-4 text-sm font-semibold hover:underline ${addClass}`}
    >
      {addLabel}
    </button>
  </div>
);

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon size={17} />
      <span className="text-xs">{label}</span>
    </div>
    <p className="mt-2 truncate text-lg font-bold text-gray-900">{value}</p>
  </div>
);

export default EditCourse;
