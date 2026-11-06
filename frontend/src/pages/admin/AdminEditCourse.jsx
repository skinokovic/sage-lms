import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Eye,
  FileText,
  Image as ImageIcon,
  Layers3,
  Save,
  Settings2,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import {
  fetchCourseById,
  updateCourse,
  uploadCourseThumbnail,
  clearCurrentCourse,
} from "../../store/courseSlice";

const AdminEditCourse = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { courseId } = useParams();

  const {
    current: course,
    currentStatus,
    currentError,
    saving,
  } = useSelector((state) => state.courses);

  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    level: "Beginner",
    duration: "",
    language: "English",
    price: "",
    status: "Draft",
  });

  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  useEffect(() => {
    dispatch(fetchCourseById(courseId));

    return () => {
      dispatch(clearCurrentCourse());
    };
  }, [dispatch, courseId]);

  // Sync the editable form from the fetched course once it arrives.
  useEffect(() => {
    if (!course) return;

    setForm({
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "Beginner",
      duration: course.duration || "",
      language: course.language || "English",
      price: course.price ?? "",
      status: course.status || "Draft",
    });

    setThumbnailPreview(course.thumbnail || "");
  }, [course]);

  const modules = course?.modules || [];
  const lessonCount = modules.reduce(
    (total, courseModule) => total + (courseModule.lessons?.length || 0),
    0,
  );

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  // Uploads immediately on selection — the thumbnail has its own endpoint,
  // so it doesn't wait for "Save Changes" the way the rest of the form does.
  const handleThumbnailChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingThumbnail(true);

    try {
      const updated = await dispatch(
        uploadCourseThumbnail({ id: courseId, file }),
      ).unwrap();

      setThumbnailPreview(updated.thumbnail);
      toast.success("Thumbnail updated.");
    } catch (err) {
      toast.error(err || "Unable to upload thumbnail.");
    } finally {
      setUploadingThumbnail(false);
    }
  };

  const validate = () => {
    if (!form.title.trim()) {
      toast.error("Course title is required.");
      return false;
    }
    if (!form.description.trim()) {
      toast.error("Course description is required.");
      return false;
    }
    if (!form.category.trim()) {
      toast.error("Course category is required.");
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

  const persistCourse = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        updateCourse({
          id: courseId,
          payload: { ...form, price: Number(form.price) },
        }),
      ).unwrap();

      toast.success("Course changes saved successfully.");
    } catch (err) {
      toast.error(err || "Unable to save course changes.");
    }
  };

  const handleManageCurriculum = () => {
    navigate(`/dashboard/admin/courses/${courseId}/builder`);
  };

  const handlePreview = () => {
    navigate(`/dashboard/admin/courses/${courseId}/learn`);
  };

  if (currentStatus === "loading" || currentStatus === "idle") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="mt-4 text-sm text-gray-500">Loading course...</p>
        </div>
      </div>
    );
  }

  if (currentError || !course) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-primary">
            <BookOpen size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Course not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            We could not find the course associated with this URL. Return to
            Courses and select a course again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/courses")}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000]"
          >
            <ArrowLeft size={17} />
            Back to Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-350 space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/courses")}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={17} />
            Back to Courses
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Edit Course
            </h1>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                form.status === "Published"
                  ? "bg-green-100 text-green-700"
                  : form.status === "Archived"
                    ? "bg-gray-100 text-gray-600"
                    : "bg-yellow-100 text-yellow-700"
              }`}
            >
              {form.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-gray-500">{form.title}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePreview}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Eye size={17} />
            Preview Course
          </button>
          <button
            type="button"
            onClick={handleManageCurriculum}
            className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-xl border border-primary/20 bg-red-50 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-red-100"
          >
            <Layers3 size={17} />
            Manage Curriculum
          </button>
          <button
            type="button"
            onClick={persistCourse}
            disabled={saving}
            className="inline-flex items-center cursor-pointer justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save size={17} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          icon={Users}
          label="Students"
          value={course.students || 0}
        />
        <SummaryCard icon={BookOpen} label="Lessons" value={lessonCount} />
        <SummaryCard
          icon={Clock3}
          label="Duration"
          value={form.duration || "—"}
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Rating"
          value={course.rating ? `${course.rating}/5` : "New"}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <main className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
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
                  className="input"
                  placeholder="Enter course title"
                />
              </Field>

              <Field label="Description" required>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={6}
                  className="input resize-y"
                  placeholder="Describe what students will learn..."
                />
              </Field>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <Field label="Category" required>
                  <input
                    value={form.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="input"
                    placeholder="e.g. Automation"
                  />
                </Field>

                <Field label="Level">
                  <select
                    value={form.level}
                    onChange={(e) => handleChange("level", e.target.value)}
                    className="input"
                  >
                    <option>Beginner</option>
                    <option>Intermediate</option>
                    <option>Advanced</option>
                  </select>
                </Field>

                <Field label="Duration" required>
                  <input
                    value={form.duration}
                    onChange={(e) => handleChange("duration", e.target.value)}
                    className="input"
                    placeholder="e.g. 8 weeks"
                  />
                </Field>

                <Field label="Language">
                  <select
                    value={form.language}
                    onChange={(e) => handleChange("language", e.target.value)}
                    className="input"
                  >
                    <option>English</option>
                    <option>French</option>
                    <option>Other</option>
                  </select>
                </Field>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-primary">
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
              <Field label="Price (NGN)" required>
                <input
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) => handleChange("price", e.target.value)}
                  className="input"
                  placeholder="0"
                />
              </Field>

              <Field label="Status">
                <select
                  value={form.status}
                  onChange={(e) => handleChange("status", e.target.value)}
                  className="input"
                >
                  <option>Draft</option>
                  <option>Published</option>
                  <option>Archived</option>
                </select>
              </Field>
            </div>
          </section>
        </main>

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

              <label
                className={`mt-4 flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 ${
                  uploadingThumbnail
                    ? "cursor-not-allowed opacity-60"
                    : "cursor-pointer"
                }`}
              >
                <ImageIcon size={17} />
                {uploadingThumbnail ? "Uploading..." : "Choose Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  disabled={uploadingThumbnail}
                  className="hidden"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
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
              className="mt-4 flex w-full items-center cursor-pointer justify-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm font-semibold text-white hover:bg-[#172f70]"
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
      {label} {required && <span className="text-primary">*</span>}
    </span>
    {children}
  </label>
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

export default AdminEditCourse;
