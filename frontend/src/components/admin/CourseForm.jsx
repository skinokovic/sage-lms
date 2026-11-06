import { useRef, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  FileText,
  Image as ImageIcon,
  Info,
  Save,
  Upload,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

const COURSE_CATEGORIES = [
  "Data Analysis & Analytics",
  "Frontend Development",
  "Backend Development",
  "Fullstack Development",
  "Cybersecurity",
  "Cloud",
  "Python",
  "Business",
  "Product Design",
  "Project Management",
  "Information Technology",
];

const COURSE_LEVELS = ["All Levels", "Beginner", "Intermediate", "Advanced"];

const COURSE_STATUSES = ["Draft", "Published"];

const INITIAL_FORM = {
  title: "",
  shortDescription: "",
  description: "",
  category: "",
  level: "",
  duration: "",
  price: "",
  language: "English",
  objectives: [""],
  prerequisites: [""],
  status: "Draft",
};

const CourseForm = ({
  initialValues = INITIAL_FORM,
  submitLabel = "Create Course",
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    ...INITIAL_FORM,
    ...initialValues,
    objectives:
      initialValues.objectives?.length > 0 ? initialValues.objectives : [""],
    prerequisites:
      initialValues.prerequisites?.length > 0
        ? initialValues.prerequisites
        : [""],
  });

  const [thumbnail, setThumbnail] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(
    initialValues.thumbnail || "",
  );

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef(null);

  // ---------------------------------------------------------
  // Basic field changes
  // ---------------------------------------------------------

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((previous) => ({
        ...previous,
        [name]: "",
      }));
    }
  };

  // ---------------------------------------------------------
  // Objectives
  // ---------------------------------------------------------

  const handleObjectiveChange = (index, value) => {
    setFormData((previous) => {
      const objectives = [...previous.objectives];
      objectives[index] = value;

      return {
        ...previous,
        objectives,
      };
    });
  };

  const addObjective = () => {
    setFormData((previous) => ({
      ...previous,
      objectives: [...previous.objectives, ""],
    }));
  };

  const removeObjective = (index) => {
    setFormData((previous) => {
      if (previous.objectives.length === 1) {
        return previous;
      }

      return {
        ...previous,
        objectives: previous.objectives.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      };
    });
  };

  // ---------------------------------------------------------
  // Prerequisites
  // ---------------------------------------------------------

  const handlePrerequisiteChange = (index, value) => {
    setFormData((previous) => {
      const prerequisites = [...previous.prerequisites];
      prerequisites[index] = value;

      return {
        ...previous,
        prerequisites,
      };
    });
  };

  const addPrerequisite = () => {
    setFormData((previous) => ({
      ...previous,
      prerequisites: [...previous.prerequisites, ""],
    }));
  };

  const removePrerequisite = (index) => {
    setFormData((previous) => {
      if (previous.prerequisites.length === 1) {
        return previous;
      }

      return {
        ...previous,
        prerequisites: previous.prerequisites.filter(
          (_, itemIndex) => itemIndex !== index,
        ),
      };
    });
  };

  // ---------------------------------------------------------
  // Thumbnail
  // ---------------------------------------------------------

  const handleThumbnailChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Thumbnail image must be smaller than 5MB.");
      return;
    }

    setThumbnail(file);

    const previewUrl = URL.createObjectURL(file);
    setThumbnailPreview(previewUrl);

    setErrors((previous) => ({
      ...previous,
      thumbnail: "",
    }));
  };

  const removeThumbnail = () => {
    setThumbnail(null);
    setThumbnailPreview("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ---------------------------------------------------------
  // Validation
  // ---------------------------------------------------------

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Course title is required.";
    } else if (formData.title.trim().length < 5) {
      newErrors.title = "Course title must be at least 5 characters.";
    }

    if (!formData.shortDescription.trim()) {
      newErrors.shortDescription = "Short description is required.";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Course description is required.";
    }

    if (!formData.category) {
      newErrors.category = "Please select a category.";
    }

    if (!formData.level) {
      newErrors.level = "Please select a course level.";
    }

    if (!formData.duration.trim()) {
      newErrors.duration = "Course duration is required.";
    }

    if (formData.price === "") {
      newErrors.price = "Course price is required.";
    } else if (Number(formData.price) < 0) {
      newErrors.price = "Price cannot be negative.";
    }

    const validObjectives = formData.objectives.filter((objective) =>
      objective.trim(),
    );

    if (validObjectives.length === 0) {
      newErrors.objectives = "Add at least one learning objective.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  // ---------------------------------------------------------
  // Submit
  // ---------------------------------------------------------

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanedData = {
        ...formData,
        title: formData.title.trim(),
        shortDescription: formData.shortDescription.trim(),
        description: formData.description.trim(),
        duration: formData.duration.trim(),
        price: Number(formData.price),
        objectives: formData.objectives
          .map((objective) => objective.trim())
          .filter(Boolean),
        prerequisites: formData.prerequisites
          .map((prerequisite) => prerequisite.trim())
          .filter(Boolean),
        thumbnail,
      };

      if (onSubmit) {
        await onSubmit(cleanedData);
      } else {
        // Frontend-only mock submission
        await new Promise((resolve) => setTimeout(resolve, 800));

        toast.success(
          formData.status === "Published"
            ? "Course published successfully."
            : "Course saved as draft.",
        );

        console.log("COURSE FORM DATA:", cleanedData);
      }
    } catch (error) {
      console.error("Course submission error:", error);

      toast.error(
        error?.message || "Something went wrong while saving the course.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------------------------------------------------------
  // Reusable UI helpers
  // ---------------------------------------------------------

  const inputClass = (fieldName) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 ${
      errors[fieldName]
        ? "border-red-400 focus:border-red-500 focus:ring-red-100"
        : "border-gray-200"
    }`;

  const labelClass = "mb-2 block text-sm font-semibold text-gray-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* =====================================================
          BASIC COURSE INFORMATION
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BookOpen size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Course Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Provide the basic information students will see about this
                course.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-5 p-5 sm:p-6">
          {/* Course title */}

          <div>
            <label htmlFor="title" className={labelClass}>
              Course Title <span className="text-red-500">*</span>
            </label>

            <input
              id="title"
              name="title"
              type="text"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Industrial Automation Fundamentals"
              className={inputClass("title")}
            />

            {errors.title && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={14} />
                {errors.title}
              </p>
            )}
          </div>

          {/* Short description */}

          <div>
            <label htmlFor="shortDescription" className={labelClass}>
              Short Description <span className="text-red-500">*</span>
            </label>

            <textarea
              id="shortDescription"
              name="shortDescription"
              rows={3}
              maxLength={500}
              value={formData.shortDescription}
              onChange={handleChange}
              placeholder="Give students a short overview of what they will learn..."
              className={`${inputClass("shortDescription")} resize-none`}
            />

            <div className="mt-2 flex justify-between gap-3">
              {errors.shortDescription ? (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {errors.shortDescription}
                </p>
              ) : (
                <span />
              )}

              <span className="text-xs text-gray-400">
                {formData.shortDescription.length}/500
              </span>
            </div>
          </div>

          {/* Full description */}

          <div>
            <label htmlFor="description" className={labelClass}>
              Course Description <span className="text-red-500">*</span>
            </label>

            <textarea
              id="description"
              name="description"
              rows={7}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the course in detail, including what students will learn and what they can expect..."
              className={`${inputClass("description")} resize-y`}
            />

            {errors.description && (
              <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                <AlertCircle size={14} />
                {errors.description}
              </p>
            )}
          </div>

          {/* Category / Level */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={`${inputClass("category")} appearance-none pr-10`}
                >
                  <option value="">Select category</option>

                  {COURSE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {errors.category && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {errors.category}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="level" className={labelClass}>
                Course Level <span className="text-red-500">*</span>
              </label>

              <div className="relative">
                <select
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className={`${inputClass("level")} appearance-none pr-10`}
                >
                  <option value="">Select level</option>

                  {COURSE_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>

                <ChevronDown
                  size={18}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                />
              </div>

              {errors.level && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {errors.level}
                </p>
              )}
            </div>
          </div>

          {/* Duration / Price / Language */}

          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label htmlFor="duration" className={labelClass}>
                Duration <span className="text-red-500">*</span>
              </label>

              <input
                id="duration"
                name="duration"
                type="text"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 8 weeks"
                className={inputClass("duration")}
              />

              {errors.duration && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {errors.duration}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="price" className={labelClass}>
                Price (₦) <span className="text-red-500">*</span>
              </label>

              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="100"
                value={formData.price}
                onChange={handleChange}
                placeholder="e.g. 50000"
                className={inputClass("price")}
              />

              {errors.price && (
                <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle size={14} />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="language" className={labelClass}>
                Language
              </label>

              <input
                id="language"
                name="language"
                type="text"
                value={formData.language}
                onChange={handleChange}
                placeholder="English"
                className={inputClass("language")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
          THUMBNAIL
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <ImageIcon size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Course Thumbnail
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Add a professional image that represents your course.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          {thumbnailPreview ? (
            <div className="relative overflow-hidden rounded-2xl border border-gray-200">
              <img
                src={thumbnailPreview}
                alt="Course thumbnail preview"
                className="h-56 w-full object-cover sm:h-72"
              />

              <button
                type="button"
                onClick={removeThumbnail}
                className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-md transition hover:bg-red-50 hover:text-red-600"
                aria-label="Remove thumbnail"
              >
                <X size={18} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 text-center transition hover:border-[#B00000] hover:bg-red-50/30"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#B00000] shadow-sm">
                <Upload size={24} />
              </div>

              <p className="mt-4 text-sm font-semibold text-gray-800">
                Click to upload course thumbnail
              </p>

              <p className="mt-1 text-xs text-gray-500">
                PNG, JPG or WEBP • Maximum 5MB
              </p>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleThumbnailChange}
            className="hidden"
          />
        </div>
      </section>

      {/* =====================================================
          LEARNING OBJECTIVES
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Learning Objectives
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Tell students what they should be able to do after completing
                the course.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="space-y-3">
            {formData.objectives.map((objective, index) => (
              <div
                key={`objective-${index}`}
                className="flex items-start gap-2"
              >
                <div className="mt-3 flex h-2 w-2 shrink-0 rounded-full bg-[#B00000]" />

                <input
                  type="text"
                  value={objective}
                  onChange={(event) =>
                    handleObjectiveChange(index, event.target.value)
                  }
                  placeholder={`Learning objective ${index + 1}`}
                  className={inputClass("objectives")}
                />

                {formData.objectives.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeObjective(index)}
                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove objective"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          {errors.objectives && (
            <p className="mt-3 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={14} />
              {errors.objectives}
            </p>
          )}

          <button
            type="button"
            onClick={addObjective}
            className="mt-4 text-sm font-semibold text-[#B00000] hover:underline"
          >
            + Add another objective
          </button>
        </div>
      </section>

      {/* =====================================================
          PREREQUISITES
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <FileText size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Prerequisites
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                List anything students should know before starting this course.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="space-y-3">
            {formData.prerequisites.map((prerequisite, index) => (
              <div
                key={`prerequisite-${index}`}
                className="flex items-start gap-2"
              >
                <div className="mt-3 flex h-2 w-2 shrink-0 rounded-full bg-[#1E3A8A]" />

                <input
                  type="text"
                  value={prerequisite}
                  onChange={(event) =>
                    handlePrerequisiteChange(index, event.target.value)
                  }
                  placeholder={`Prerequisite ${index + 1}`}
                  className={inputClass("prerequisites")}
                />

                {formData.prerequisites.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removePrerequisite(index)}
                    className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                    aria-label="Remove prerequisite"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPrerequisite}
            className="mt-4 text-sm font-semibold text-[#1E3A8A] hover:underline"
          >
            + Add another prerequisite
          </button>
        </div>
      </section>

      {/* =====================================================
          COURSE STATUS
      ====================================================== */}

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Info size={20} />
            </div>

            <div>
              <h2 className="text-base font-bold text-gray-900">
                Publishing Settings
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Choose whether this course should remain a draft or be
                published.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <label htmlFor="status" className={labelClass}>
            Course Status
          </label>

          <div className="relative max-w-md">
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`${inputClass("status")} appearance-none pr-10`}
            >
              {COURSE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <ChevronDown
              size={18}
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-700">
              {formData.status === "Published"
                ? "This course will be available to students once it is published."
                : "This course will be saved privately as a draft and will not be visible to students."}
            </p>
          </div>
        </div>
      </section>

      {/* =====================================================
          FORM ACTIONS
      ====================================================== */}

      <div className="sticky bottom-0 z-10 -mx-4 border-t border-gray-200 bg-white/95 px-4 py-4 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="mx-auto flex max-w-5xl flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <X size={18} />
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center  cursor-pointer justify-center gap-2 rounded-xl bg-[#B00000] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                {submitLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default CourseForm;
