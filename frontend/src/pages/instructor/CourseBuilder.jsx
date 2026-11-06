import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Edit3,
  ExternalLink,
  Eye,
  File,
  FileText,
  GripVertical,
  HelpCircle,
  Layers3,
  Link2,
  Loader2,
  PlayCircle,
  Plus,
  Save,
  Settings2,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { courseApi } from "../../api/courseApi";

/* ============================================================
   HELPERS
   Modules and lessons live inside the course document in MongoDB.
   Existing items keep their real ids on every save (so student progress
   stays attached to the right lesson); new items get a temporary id in the
   browser and receive a real id from the server when saved.
============================================================ */

const OBJECT_ID = /^[a-f\d]{24}$/i;
const isServerId = (id) => OBJECT_ID.test(String(id || ""));
const tempId = (prefix) =>
  `tmp-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const normalizeResource = (resource) => ({
  id: String(resource.id || resource._id || tempId("resource")),
  name: resource.name || "",
  type: resource.type || "Document",
  url: resource.url || "",
  publicId: resource.publicId || "",
});

const normalizeLesson = (lesson) => ({
  id: String(lesson.id || lesson._id || tempId("lesson")),
  title: lesson.title || "",
  type: lesson.type || "Video",
  duration: lesson.duration || "",
  description: lesson.description || "",
  content: lesson.content || "",
  videoPublicId: lesson.videoPublicId || "",
  isPreview: Boolean(lesson.isPreview),
  resources: (lesson.resources || []).map(normalizeResource),
});

// `previous` lets a save keep each module's open/closed state.
const toBuilderModules = (serverModules = [], previous = []) =>
  serverModules.map((courseModule, index) => ({
    id: String(courseModule.id || courseModule._id || tempId("module")),
    title: courseModule.title || "",
    description: courseModule.description || "",
    expanded: previous[index]?.expanded ?? index === 0,
    lessons: (courseModule.lessons || []).map(normalizeLesson),
  }));

const toServerResource = (resource) => ({
  ...(isServerId(resource.id) ? { _id: resource.id } : {}),
  name: resource.name,
  type: resource.type || "Document",
  url: resource.url || "",
  publicId: resource.publicId || "",
});

const toServerLesson = (lesson) => ({
  ...(isServerId(lesson.id) ? { _id: lesson.id } : {}),
  title: lesson.title,
  type: lesson.type,
  duration: lesson.duration || "",
  description: lesson.description || "",
  content: lesson.content || "",
  videoPublicId: lesson.videoPublicId || "",
  isPreview: Boolean(lesson.isPreview),
  resources: (lesson.resources || []).map(toServerResource),
});

// `expanded` is a screen-only flag and is never sent to the server.
const toServerModule = (courseModule) => ({
  ...(isServerId(courseModule.id) ? { _id: courseModule.id } : {}),
  title: courseModule.title,
  description: courseModule.description || "",
  lessons: (courseModule.lessons || []).map(toServerLesson),
});

const snapshotOf = (course, modules) =>
  JSON.stringify({
    title: course?.title || "",
    description: course?.description || "",
    modules: modules.map(toServerModule),
  });

/* ============================================================
   OPTIONS
============================================================ */

const LESSON_TYPES = [
  {
    value: "Video",
    label: "Video",
    description: "Video-based lesson",
    icon: Video,
  },
  {
    value: "Text",
    label: "Text Lesson",
    description: "Written lesson content",
    icon: FileText,
  },
  {
    value: "Document",
    label: "Document",
    description: "PDF or downloadable document",
    icon: File,
  },
  {
    value: "External Link",
    label: "External Link",
    description: "Lesson hosted on another website",
    icon: ExternalLink,
  },
  {
    value: "Quiz",
    label: "Quiz",
    description: "Assess student understanding",
    icon: HelpCircle,
  },
  {
    value: "Assignment",
    label: "Assignment",
    description: "Practical student task",
    icon: ClipboardList,
  },
];

/* ============================================================
   MAIN COMPONENT
============================================================ */

const CourseBuilder = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState("");

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const [activeTab, setActiveTab] = useState("curriculum");

  const [showModuleModal, setShowModuleModal] = useState(false);
  const [showLessonModal, setShowLessonModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [editingModule, setEditingModule] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [selectedModuleId, setSelectedModuleId] = useState(null);

  /* ----------------------------------------------------------
     LOAD COURSE FROM THE DATABASE
  ---------------------------------------------------------- */

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await courseApi.getById(courseId);
      const loaded = data.course;
      const loadedModules = toBuilderModules(loaded.modules);

      setCourse(loaded);
      setModules(loadedModules);
      setSavedSnapshot(snapshotOf(loaded, loadedModules));
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

  /* ----------------------------------------------------------
     UNSAVED CHANGES
  ---------------------------------------------------------- */

  const isDirty = useMemo(
    () => Boolean(course) && snapshotOf(course, modules) !== savedSnapshot,
    [course, modules, savedSnapshot],
  );

  useEffect(() => {
    if (!isDirty) return undefined;

    const warn = (event) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const goBack = () => {
    if (
      isDirty &&
      !window.confirm("You have unsaved changes. Leave without saving?")
    ) {
      return;
    }
    navigate("/dashboard/instructor/courses");
  };

  /* ----------------------------------------------------------
     COURSE STATS
  ---------------------------------------------------------- */

  const courseStats = useMemo(() => {
    const lessonList = modules.flatMap((courseModule) => courseModule.lessons);

    return {
      modules: modules.length,
      lessons: lessonList.length,
      videos: lessonList.filter((lesson) => lesson.type === "Video").length,
      quizzes: lessonList.filter((lesson) => lesson.type === "Quiz").length,
      assignments: lessonList.filter((lesson) => lesson.type === "Assignment")
        .length,
      previews: lessonList.filter((lesson) => lesson.isPreview).length,
    };
  }, [modules]);

  /* ==========================================================
     MODULE FUNCTIONS
  ========================================================== */

  const openCreateModule = () => {
    setEditingModule(null);
    setShowModuleModal(true);
  };

  const openEditModule = (courseModule) => {
    setEditingModule(courseModule);
    setShowModuleModal(true);
  };

  const saveModule = (moduleData) => {
    if (editingModule) {
      setModules((previous) =>
        previous.map((courseModule) =>
          courseModule.id === editingModule.id
            ? {
                ...courseModule,
                title: moduleData.title,
                description: moduleData.description,
              }
            : courseModule,
        ),
      );

      toast.success("Module updated. Save to keep your changes.");
    } else {
      setModules((previous) => [
        ...previous,
        {
          id: tempId("module"),
          title: moduleData.title,
          description: moduleData.description,
          expanded: true,
          lessons: [],
        },
      ]);

      toast.success("Module added. Save to keep your changes.");
    }

    setShowModuleModal(false);
    setEditingModule(null);
  };

  const deleteModule = (moduleId) => {
    const moduleToDelete = modules.find(
      (courseModule) => courseModule.id === moduleId,
    );

    if (!moduleToDelete) return;

    const confirmed = window.confirm(
      `Delete "${moduleToDelete.title}" and all its lessons? Students' progress on these lessons will be lost when you save.`,
    );

    if (!confirmed) return;

    setModules((previous) =>
      previous.filter((courseModule) => courseModule.id !== moduleId),
    );

    toast.success("Module deleted. Save to keep your changes.");
  };

  const toggleModule = (moduleId) => {
    setModules((previous) =>
      previous.map((courseModule) =>
        courseModule.id === moduleId
          ? { ...courseModule, expanded: !courseModule.expanded }
          : courseModule,
      ),
    );
  };

  const moveModule = (moduleId, direction) => {
    setModules((previous) => {
      const index = previous.findIndex(
        (courseModule) => courseModule.id === moduleId,
      );

      if (index === -1) return previous;

      const newIndex = direction === "up" ? index - 1 : index + 1;

      if (newIndex < 0 || newIndex >= previous.length) {
        return previous;
      }

      const updated = [...previous];
      [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

      return updated;
    });
  };

  /* ==========================================================
     LESSON FUNCTIONS
  ========================================================== */

  const openCreateLesson = (moduleId) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(null);
    setShowLessonModal(true);
  };

  const openEditLesson = (moduleId, lesson) => {
    setSelectedModuleId(moduleId);
    setEditingLesson(lesson);
    setShowLessonModal(true);
  };

  const saveLesson = (lessonData) => {
    if (!selectedModuleId) return;

    if (editingLesson) {
      setModules((previous) =>
        previous.map((courseModule) =>
          courseModule.id !== selectedModuleId
            ? courseModule
            : {
                ...courseModule,
                lessons: courseModule.lessons.map((lesson) =>
                  lesson.id === editingLesson.id
                    ? { ...lesson, ...lessonData }
                    : lesson,
                ),
              },
        ),
      );

      toast.success("Lesson updated. Save to keep your changes.");
    } else {
      const newLesson = { id: tempId("lesson"), ...lessonData };

      setModules((previous) =>
        previous.map((courseModule) =>
          courseModule.id === selectedModuleId
            ? {
                ...courseModule,
                expanded: true,
                lessons: [...courseModule.lessons, newLesson],
              }
            : courseModule,
        ),
      );

      toast.success("Lesson added. Save to keep your changes.");
    }

    setShowLessonModal(false);
    setEditingLesson(null);
    setSelectedModuleId(null);
  };

  const deleteLesson = (moduleId, lessonId) => {
    setModules((previous) =>
      previous.map((courseModule) =>
        courseModule.id === moduleId
          ? {
              ...courseModule,
              lessons: courseModule.lessons.filter(
                (lesson) => lesson.id !== lessonId,
              ),
            }
          : courseModule,
      ),
    );

    toast.success("Lesson deleted. Save to keep your changes.");
  };

  const duplicateLesson = (moduleId, lesson) => {
    const duplicatedLesson = {
      ...lesson,
      id: tempId("lesson"),
      title: `${lesson.title} Copy`,
      resources: (lesson.resources || []).map((resource) => ({
        ...resource,
        id: tempId("resource"),
      })),
    };

    setModules((previous) =>
      previous.map((courseModule) =>
        courseModule.id === moduleId
          ? {
              ...courseModule,
              lessons: [...courseModule.lessons, duplicatedLesson],
            }
          : courseModule,
      ),
    );

    toast.success("Lesson duplicated. Save to keep your changes.");
  };

  const moveLesson = (moduleId, lessonId, direction) => {
    setModules((previous) =>
      previous.map((courseModule) => {
        if (courseModule.id !== moduleId) {
          return courseModule;
        }

        const lessons = [...courseModule.lessons];
        const index = lessons.findIndex((lesson) => lesson.id === lessonId);

        if (index === -1) return courseModule;

        const newIndex = direction === "up" ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= lessons.length) {
          return courseModule;
        }

        [lessons[index], lessons[newIndex]] = [
          lessons[newIndex],
          lessons[index],
        ];

        return { ...courseModule, lessons };
      }),
    );
  };

  /* ==========================================================
     SAVE / PUBLISH (MongoDB)
  ========================================================== */

  const validateBeforePublish = () => {
    if (!course.title.trim()) {
      toast.error("Course title is missing.");
      return false;
    }

    if (modules.length === 0) {
      toast.error("Add at least one module before publishing.");
      return false;
    }

    const emptyModules = modules.filter(
      (courseModule) => courseModule.lessons.length === 0,
    );

    if (emptyModules.length > 0) {
      toast.error(`"${emptyModules[0].title}" does not contain any lessons.`);
      return false;
    }

    return true;
  };

  const persistCourse = async ({ publish = false } = {}) => {
    if (saving || !course) return;

    if (!course.title.trim()) {
      toast.error("Course title is required.");
      return;
    }

    if (!course.description.trim()) {
      toast.error("Course description is required.");
      return;
    }

    if (publish && !validateBeforePublish()) return;

    setSaving(true);

    try {
      const payload = {
        title: course.title.trim(),
        description: course.description.trim(),
        modules: modules.map(toServerModule),
      };

      if (publish) payload.status = "Published";

      const { data } = await courseApi.update(courseId, payload);
      const saved = data.course;
      const savedModules = toBuilderModules(saved.modules, modules);

      setCourse(saved);
      setModules(savedModules);
      setSavedSnapshot(snapshotOf(saved, savedModules));

      toast.success(
        publish
          ? "Course published successfully."
          : "Course saved successfully.",
      );
    } catch (error) {
      console.error("Save course error:", error);
      toast.error(
        error.response?.data?.message || "Unable to save the course.",
      );
    } finally {
      setSaving(false);
    }
  };

  /* ==========================================================
     RENDER
  ========================================================== */

  if (loading && !course) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#B00000]" />
          <p className="mt-4 text-sm font-medium text-gray-600">
            Loading course builder...
          </p>
        </div>
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <BookOpen size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Couldn't open the course builder
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            {loadError || "We could not find this course."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadCourse}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/instructor/courses")}
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

  return (
    <div className="min-h-full">
      {/* ======================================================
          TOP HEADER
      ======================================================= */}

      <div className="mb-6">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#B00000]"
        >
          <ArrowLeft size={17} />
          Back to My Courses
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B00000]/10 text-[#B00000] sm:flex">
              <BookOpen size={24} />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Course Builder
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
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Eye size={17} />
              Preview
            </button>

            <button
              type="button"
              onClick={() => persistCourse()}
              disabled={saving || !isDirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving
                ? "Saving..."
                : course.status === "Published"
                  ? "Save Changes"
                  : "Save Draft"}
            </button>

            <button
              type="button"
              onClick={() => persistCourse({ publish: true })}
              disabled={saving || course.status === "Published"}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <CheckCircle2 size={17} />
              {course.status === "Published" ? "Published" : "Publish Course"}
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          COURSE SUMMARY
      ======================================================= */}

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <BuilderStat
          icon={Layers3}
          label="Modules"
          value={courseStats.modules}
        />

        <BuilderStat
          icon={BookOpen}
          label="Lessons"
          value={courseStats.lessons}
        />

        <BuilderStat icon={Video} label="Videos" value={courseStats.videos} />

        <BuilderStat
          icon={HelpCircle}
          label="Quizzes"
          value={courseStats.quizzes}
        />

        <BuilderStat
          icon={ClipboardList}
          label="Assignments"
          value={courseStats.assignments}
        />

        <BuilderStat
          icon={Eye}
          label="Preview Lessons"
          value={courseStats.previews}
        />
      </div>

      {/* ======================================================
          TABS
      ======================================================= */}

      <div className="mb-6 overflow-x-auto border-b border-gray-200">
        <div className="flex min-w-max gap-6">
          <BuilderTab
            active={activeTab === "curriculum"}
            onClick={() => setActiveTab("curriculum")}
            icon={Layers3}
            label="Curriculum"
          />

          <BuilderTab
            active={activeTab === "settings"}
            onClick={() => setActiveTab("settings")}
            icon={Settings2}
            label="Course Settings"
          />
        </div>
      </div>

      {/* ======================================================
          CURRICULUM
      ======================================================= */}

      {activeTab === "curriculum" && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <main>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  Course Curriculum
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Organize your course into modules and lessons.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreateModule}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                <Plus size={18} />
                Add Module
              </button>
            </div>

            <div className="space-y-4">
              {modules.length === 0 ? (
                <EmptyCurriculum onAddModule={openCreateModule} />
              ) : (
                modules.map((courseModule, moduleIndex) => (
                  <ModuleCard
                    key={courseModule.id}
                    module={courseModule}
                    moduleIndex={moduleIndex}
                    totalModules={modules.length}
                    onToggle={() => toggleModule(courseModule.id)}
                    onEdit={() => openEditModule(courseModule)}
                    onDelete={() => deleteModule(courseModule.id)}
                    onMoveUp={() => moveModule(courseModule.id, "up")}
                    onMoveDown={() => moveModule(courseModule.id, "down")}
                    onAddLesson={() => openCreateLesson(courseModule.id)}
                    onEditLesson={(lesson) =>
                      openEditLesson(courseModule.id, lesson)
                    }
                    onDeleteLesson={(lessonId) =>
                      deleteLesson(courseModule.id, lessonId)
                    }
                    onDuplicateLesson={(lesson) =>
                      duplicateLesson(courseModule.id, lesson)
                    }
                    onMoveLesson={(lessonId, direction) =>
                      moveLesson(courseModule.id, lessonId, direction)
                    }
                  />
                ))
              )}
            </div>

            {modules.length > 0 && (
              <button
                type="button"
                onClick={openCreateModule}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gray-300 bg-white py-5 text-sm font-semibold text-gray-500 transition hover:border-[#B00000] hover:bg-red-50/20 hover:text-[#B00000]"
              >
                <Plus size={18} />
                Add Another Module
              </button>
            )}
          </main>

          <aside className="space-y-5">
            <BuilderSidebar
              course={course}
              modules={modules}
              onPreview={() => setShowPreview(true)}
            />
          </aside>
        </div>
      )}

      {/* ======================================================
          SETTINGS
      ======================================================= */}

      {activeTab === "settings" && (
        <CourseSettings course={course} setCourse={setCourse} />
      )}

      {/* ======================================================
          MODALS
      ======================================================= */}

      {showModuleModal && (
        <ModuleModal
          module={editingModule}
          onClose={() => {
            setShowModuleModal(false);
            setEditingModule(null);
          }}
          onSave={saveModule}
        />
      )}

      {showLessonModal && (
        <LessonModal
          lesson={editingLesson}
          onClose={() => {
            setShowLessonModal(false);
            setEditingLesson(null);
            setSelectedModuleId(null);
          }}
          onSave={saveLesson}
        />
      )}

      {showPreview && (
        <CoursePreview
          course={course}
          modules={modules}
          onClose={() => setShowPreview(false)}
        />
      )}
    </div>
  );
};

export default CourseBuilder;

/* ============================================================
   BUILDER STAT
============================================================ */

const BuilderStat = ({ icon: Icon, label, value }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <Icon size={17} className="text-[#B00000]" />

        <span className="text-xs text-gray-500">{label}</span>
      </div>

      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
    </div>
  );
};

/* ============================================================
   TAB
============================================================ */

const BuilderTab = ({ active, onClick, icon: Icon, label }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-2 pb-3 text-sm font-semibold transition ${
        active ? "text-[#B00000]" : "text-gray-500 hover:text-gray-800"
      }`}
    >
      <Icon size={17} />
      {label}

      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full bg-[#B00000]" />
      )}
    </button>
  );
};

/* ============================================================
   MODULE CARD
============================================================ */

const ModuleCard = ({
  module,
  moduleIndex,
  totalModules,
  onToggle,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onDuplicateLesson,
  onMoveLesson,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50/80 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={onToggle}
            className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm transition hover:text-[#B00000]"
          >
            {module.expanded ? (
              <ChevronDown size={18} />
            ) : (
              <ChevronRight size={18} />
            )}
          </button>

          <div className="flex min-w-0 flex-1 gap-3">
            <div className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#B00000]/10 text-xs font-bold text-[#B00000] sm:flex">
              {String(moduleIndex + 1).padStart(2, "0")}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold text-gray-900">{module.title}</h3>

                <span className="rounded-full bg-gray-200 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                  {module.lessons.length}{" "}
                  {module.lessons.length === 1 ? "lesson" : "lessons"}
                </span>
              </div>

              {module.description && (
                <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                  {module.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={moduleIndex === 0}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
              title="Move module up"
            >
              <ArrowUp size={16} />
            </button>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={moduleIndex === totalModules - 1}
              className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
              title="Move module down"
            >
              <ArrowDown size={16} />
            </button>

            <button
              type="button"
              onClick={onEdit}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-white hover:text-blue-600"
              title="Edit module"
            >
              <Edit3 size={16} />
            </button>

            <button
              type="button"
              onClick={onDelete}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition hover:bg-red-50 hover:text-red-600"
              title="Delete module"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      {module.expanded && (
        <div className="p-3 sm:p-4">
          {module.lessons.length > 0 && (
            <div className="space-y-2">
              {module.lessons.map((lesson, lessonIndex) => (
                <LessonRow
                  key={lesson.id}
                  lesson={lesson}
                  lessonIndex={lessonIndex}
                  totalLessons={module.lessons.length}
                  onEdit={() => onEditLesson(lesson)}
                  onDelete={() => onDeleteLesson(lesson.id)}
                  onDuplicate={() => onDuplicateLesson(lesson)}
                  onMoveUp={() => onMoveLesson(lesson.id, "up")}
                  onMoveDown={() => onMoveLesson(lesson.id, "down")}
                />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={onAddLesson}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-semibold text-gray-500 transition hover:border-[#B00000] hover:bg-red-50/20 hover:text-[#B00000]"
          >
            <Plus size={17} />
            Add Lesson
          </button>
        </div>
      )}
    </section>
  );
};

/* ============================================================
   LESSON ROW
============================================================ */

const LessonRow = ({
  lesson,
  lessonIndex,
  totalLessons,
  onEdit,
  onDelete,
  onDuplicate,
  onMoveUp,
  onMoveDown,
}) => {
  const typeIcon = {
    Video,
    Text: FileText,
    Document: File,
    "External Link": ExternalLink,
    Quiz: HelpCircle,
    Assignment: ClipboardList,
  };

  const Icon = typeIcon[lesson.type] || FileText;

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-3 transition hover:border-gray-300 hover:shadow-sm sm:p-4">
      <div className="flex items-start gap-3">
        <div className="mt-1 hidden text-gray-300 sm:block">
          <GripVertical size={17} />
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
          <Icon size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-gray-900">
              {lesson.title}
            </h4>

            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
              {lesson.type}
            </span>

            {lesson.isPreview && (
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                Free Preview
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
            {lesson.duration && (
              <span className="inline-flex items-center gap-1">
                <Clock3 size={13} />
                {lesson.duration}
              </span>
            )}

            {lesson.resources?.length > 0 && (
              <span className="inline-flex items-center gap-1">
                <File size={13} />
                {lesson.resources.length} resource
                {lesson.resources.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={lessonIndex === 0}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 sm:flex"
            title="Move lesson up"
          >
            <ArrowUp size={15} />
          </button>

          <button
            type="button"
            onClick={onMoveDown}
            disabled={lessonIndex === totalLessons - 1}
            className="hidden h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-30 sm:flex"
            title="Move lesson down"
          >
            <ArrowDown size={15} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Edit lesson"
          >
            <Edit3 size={15} />
          </button>

          <button
            type="button"
            onClick={onDuplicate}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Duplicate lesson"
          >
            <Copy size={15} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Delete lesson"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   MODULE MODAL
============================================================ */

const ModuleModal = ({ module, onClose, onSave }) => {
  const [title, setTitle] = useState(module?.title || "");
  const [description, setDescription] = useState(module?.description || "");
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!title.trim()) {
      setError("Module title is required.");
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
    });
  };

  return (
    <Modal
      title={module ? "Edit Module" : "Add Module"}
      onClose={onClose}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Module Title <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              setError("");
            }}
            placeholder="e.g. Process Control Fundamentals"
            className={`w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 ${
              error ? "border-red-400" : "border-gray-200"
            }`}
            autoFocus
          />

          {error && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Module Description
          </label>

          <textarea
            rows={4}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Briefly describe what students will learn in this module..."
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
          />
        </div>

        <ModalActions
          onClose={onClose}
          submitLabel={module ? "Save Changes" : "Add Module"}
        />
      </form>
    </Modal>
  );
};

/* ============================================================
   LESSON MODAL
============================================================ */

const LessonModal = ({ lesson, onClose, onSave }) => {
  const [form, setForm] = useState({
    title: lesson?.title || "",
    type: lesson?.type || "Video",
    duration: lesson?.duration || "",
    description: lesson?.description || "",
    content: lesson?.content || "",
    videoPublicId: lesson?.videoPublicId || "",
    isPreview: lesson?.isPreview || false,
    resources: lesson?.resources || [],
  });

  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [resourceDraft, setResourceDraft] = useState({ name: "", url: "" });

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));

    if (field === "title") {
      setError("");
    }
  };

  // Pasting a link replaces any uploaded video.
  const handleContentChange = (value) => {
    setForm((previous) => ({
      ...previous,
      content: value,
      videoPublicId: previous.type === "Video" ? "" : previous.videoPublicId,
    }));
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      toast.error("Please choose a video file.");
      return;
    }

    setUploading(true);

    try {
      const { data } = await courseApi.uploadVideo(file);

      setForm((previous) => ({
        ...previous,
        content: data.url,
        videoPublicId: data.publicId || "",
      }));

      toast.success("Video uploaded.");
    } catch (uploadError) {
      toast.error(
        uploadError.response?.data?.message ||
          "Video upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleResourceAdd = () => {
    const name = resourceDraft.name.trim();

    if (!name) {
      toast.error("Enter a resource name.");
      return;
    }

    setForm((previous) => ({
      ...previous,
      resources: [
        ...previous.resources,
        {
          id: tempId("resource"),
          name,
          type: "Document",
          url: resourceDraft.url.trim(),
          publicId: "",
        },
      ],
    }));

    setResourceDraft({ name: "", url: "" });
  };

  const removeResource = (resourceId) => {
    setForm((previous) => ({
      ...previous,
      resources: previous.resources.filter(
        (resource) => resource.id !== resourceId,
      ),
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (uploading) return;

    if (!form.title.trim()) {
      setError("Lesson title is required.");
      return;
    }

    onSave({
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      content: form.content.trim(),
    });
  };

  return (
    <Modal
      title={lesson ? "Edit Lesson" : "Add Lesson"}
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Lesson Title <span className="text-red-500">*</span>
          </label>

          <input
            type="text"
            value={form.title}
            onChange={(event) => handleChange("title", event.target.value)}
            placeholder="e.g. Introduction to PID Control"
            className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10 ${
              error ? "border-red-400" : "border-gray-200"
            }`}
            autoFocus
          />

          {error && (
            <p className="mt-2 flex items-center gap-1 text-xs text-red-600">
              <AlertCircle size={14} />
              {error}
            </p>
          )}
        </div>

        {/* Lesson type */}

        <div>
          <label className="mb-3 block text-sm font-semibold text-gray-700">
            Lesson Type
          </label>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {LESSON_TYPES.map((type) => {
              const Icon = type.icon;
              const active = form.type === type.value;

              return (
                <button
                  type="button"
                  key={type.value}
                  onClick={() => handleChange("type", type.value)}
                  className={`rounded-xl border p-3 text-left transition ${
                    active
                      ? "border-[#B00000] bg-red-50 ring-1 ring-[#B00000]"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon
                      size={18}
                      className={active ? "text-[#B00000]" : "text-gray-500"}
                    />

                    <span
                      className={`text-sm font-semibold ${
                        active ? "text-[#B00000]" : "text-gray-700"
                      }`}
                    >
                      {type.label}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    {type.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Duration / preview */}

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Duration
            </label>

            <input
              type="text"
              value={form.duration}
              onChange={(event) => handleChange("duration", event.target.value)}
              placeholder="e.g. 25 min"
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>

          <div className="flex items-end">
            <label className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-gray-200 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isPreview}
                onChange={(event) =>
                  handleChange("isPreview", event.target.checked)
                }
                className="h-4 w-4 rounded border-gray-300 text-[#B00000] focus:ring-[#B00000]"
              />

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Free Preview
                </p>

                <p className="text-xs text-gray-500">
                  Allow students to preview this lesson.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Description */}

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Lesson Description
          </label>

          <textarea
            rows={3}
            value={form.description}
            onChange={(event) =>
              handleChange("description", event.target.value)
            }
            placeholder="Describe what students will learn in this lesson..."
            className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
          />
        </div>

        {/* Content depending on type */}

        <LessonContentFields
          form={form}
          onContentChange={handleContentChange}
          onVideoUpload={handleVideoUpload}
          uploading={uploading}
        />

        {/* Resources */}

        <div className="rounded-xl border border-gray-200 p-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Lesson Resources
            </h3>

            <p className="mt-1 text-xs text-gray-500">
              Add supporting documents as links (for example a PDF hosted on
              Google Drive).
            </p>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="text"
              value={resourceDraft.name}
              onChange={(event) =>
                setResourceDraft((previous) => ({
                  ...previous,
                  name: event.target.value,
                }))
              }
              placeholder="Resource name"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#B00000]"
            />

            <input
              type="url"
              value={resourceDraft.url}
              onChange={(event) =>
                setResourceDraft((previous) => ({
                  ...previous,
                  url: event.target.value,
                }))
              }
              placeholder="https://… (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-[#B00000]"
            />

            <button
              type="button"
              onClick={handleResourceAdd}
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              <Plus size={14} />
              Add
            </button>
          </div>

          {form.resources.length > 0 && (
            <div className="mt-4 space-y-2">
              {form.resources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-3 rounded-lg bg-gray-50 p-3"
                >
                  <File size={17} className="text-gray-500" />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-700">
                      {resource.name}
                    </p>
                    {resource.url && (
                      <p className="truncate text-xs text-gray-400">
                        {resource.url}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => removeResource(resource.id)}
                    className="text-gray-400 hover:text-red-600"
                    aria-label="Remove resource"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <ModalActions
          onClose={onClose}
          submitLabel={lesson ? "Save Lesson" : "Add Lesson"}
          disabled={uploading}
        />
      </form>
    </Modal>
  );
};

/* ============================================================
   LESSON CONTENT FIELDS
============================================================ */

const LessonContentFields = ({
  form,
  onContentChange,
  onVideoUpload,
  uploading,
}) => {
  switch (form.type) {
    case "Video":
      return (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Video
          </label>

          <div className="relative">
            <Video
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="url"
              value={form.content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="Paste a YouTube, Vimeo or video link"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-xs text-gray-400">or</span>

            <label
              className={`inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-xs font-semibold text-gray-700 transition ${
                uploading
                  ? "cursor-not-allowed opacity-60"
                  : "cursor-pointer hover:bg-gray-50"
              }`}
            >
              {uploading ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Upload size={15} />
              )}
              {uploading ? "Uploading video…" : "Upload a video file"}

              <input
                type="file"
                accept="video/*"
                onChange={onVideoUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>

            {form.videoPublicId && !uploading && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                <Check size={14} />
                Uploaded video attached
              </span>
            )}
          </div>
        </div>
      );

    case "Text":
      return (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Lesson Content
          </label>

          <textarea
            rows={8}
            value={form.content}
            onChange={(event) => onContentChange(event.target.value)}
            placeholder="Write the lesson content here..."
            className="w-full resize-y rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
          />
        </div>
      );

    case "Document":
      return (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            Document Link
          </label>

          <div className="relative">
            <File
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="url"
              value={form.content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="https://… link to a PDF or document"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>
        </div>
      );

    case "External Link":
      return (
        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700">
            External Lesson URL
          </label>

          <div className="relative">
            <Link2
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="url"
              value={form.content}
              onChange={(event) => onContentChange(event.target.value)}
              placeholder="https://example.com/lesson"
              className="w-full rounded-xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
            />
          </div>
        </div>
      );

    case "Quiz":
      return (
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <div className="flex gap-3">
            <HelpCircle size={20} className="shrink-0 text-blue-600" />

            <div>
              <p className="text-sm font-semibold text-blue-900">
                Quiz Builder
              </p>

              <p className="mt-1 text-xs leading-5 text-blue-700">
                The lesson will be created as a quiz. Questions and answer
                options can be added after saving the lesson.
              </p>
            </div>
          </div>
        </div>
      );

    case "Assignment":
      return (
        <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
          <div className="flex gap-3">
            <ClipboardList size={20} className="shrink-0 text-purple-600" />

            <div>
              <p className="text-sm font-semibold text-purple-900">
                Assignment Builder
              </p>

              <p className="mt-1 text-xs leading-5 text-purple-700">
                The assignment details, instructions, attachments and grading
                criteria can be configured after saving the lesson.
              </p>
            </div>
          </div>
        </div>
      );

    default:
      return null;
  }
};

/* ============================================================
   BUILDER SIDEBAR
============================================================ */

const BuilderSidebar = ({ course, modules, onPreview }) => {
  const totalLessons = modules.reduce(
    (total, courseModule) => total + courseModule.lessons.length,
    0,
  );

  return (
    <>
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">Course Information</h2>

        <div className="mt-4 space-y-4">
          <SidebarInfo label="Category" value={course.category} />

          <SidebarInfo label="Level" value={course.level} />

          <SidebarInfo label="Duration" value={course.duration} />

          <SidebarInfo label="Modules" value={modules.length} />

          <SidebarInfo label="Lessons" value={totalLessons} />
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-bold text-gray-900">
          Publishing Checklist
        </h2>

        <div className="mt-4 space-y-3">
          <ChecklistItem
            label="Course information"
            complete={Boolean(course.title)}
          />

          <ChecklistItem
            label="At least one module"
            complete={modules.length > 0}
          />

          <ChecklistItem label="Course lessons" complete={totalLessons > 0} />

          <ChecklistItem
            label="Course structure"
            complete={
              modules.length > 0 &&
              modules.every((courseModule) => courseModule.lessons.length > 0)
            }
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onPreview}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#B00000]/20 bg-red-50 px-4 py-3 text-sm font-semibold text-[#B00000] transition hover:bg-red-100"
      >
        <Eye size={18} />
        Preview Course
      </button>
    </>
  );
};

const SidebarInfo = ({ label, value }) => (
  <div>
    <p className="text-xs text-gray-400">{label}</p>

    <p className="mt-1 text-sm font-semibold text-gray-800">
      {value || "Not set"}
    </p>
  </div>
);

const ChecklistItem = ({ label, complete }) => (
  <div className="flex items-center gap-2">
    <div
      className={`flex h-5 w-5 items-center justify-center rounded-full ${
        complete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
      }`}
    >
      <Check size={13} />
    </div>

    <span className={`text-xs ${complete ? "text-gray-700" : "text-gray-400"}`}>
      {label}
    </span>
  </div>
);

/* ============================================================
   COURSE SETTINGS
============================================================ */

const SETTINGS_INPUT =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10";

const CourseSettings = ({ course, setCourse }) => {
  return (
    <div className="max-w-4xl">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">Course Settings</h2>

        <p className="mt-1 text-sm text-gray-500">
          Manage the basic settings for this course. Other details are edited on
          the Edit Course page.
        </p>
      </div>

      <div className="space-y-5">
        <SettingsCard title="Course Details">
          <div className="space-y-5">
            <SettingsField label="Course Title">
              <input
                type="text"
                value={course.title}
                onChange={(event) =>
                  setCourse((previous) => ({
                    ...previous,
                    title: event.target.value,
                  }))
                }
                className={SETTINGS_INPUT}
              />
            </SettingsField>

            <SettingsField label="Description">
              <textarea
                rows={5}
                value={course.description}
                onChange={(event) =>
                  setCourse((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                className={`${SETTINGS_INPUT} resize-y`}
              />
            </SettingsField>
          </div>
        </SettingsCard>

        <SettingsCard title="Course Status">
          <div className="rounded-xl bg-gray-50 p-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  course.status === "Published"
                    ? "bg-green-100 text-green-600"
                    : "bg-yellow-100 text-yellow-600"
                }`}
              >
                <CheckCircle2 size={20} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {course.status}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {course.status === "Published"
                    ? "Students can access this course."
                    : "This course is currently being prepared."}
                </p>
              </div>
            </div>
          </div>
        </SettingsCard>
      </div>
    </div>
  );
};

const SettingsCard = ({ title, children }) => (
  <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
    <h3 className="text-base font-bold text-gray-900">{title}</h3>

    <div className="mt-5">{children}</div>
  </section>
);

const SettingsField = ({ label, children }) => (
  <div>
    <label className="mb-2 block text-sm font-semibold text-gray-700">
      {label}
    </label>

    {children}
  </div>
);

/* ============================================================
   EMPTY CURRICULUM
============================================================ */

const EmptyCurriculum = ({ onAddModule }) => (
  <div className="rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-16 text-center">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-[#B00000]">
      <Layers3 size={28} />
    </div>

    <h3 className="mt-5 text-lg font-bold text-gray-900">
      Your course is empty
    </h3>

    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
      Start by creating your first module. You can then add lessons, videos,
      documents, quizzes and assignments.
    </p>

    <button
      type="button"
      onClick={onAddModule}
      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000]"
    >
      <Plus size={18} />
      Create First Module
    </button>
  </div>
);

/* ============================================================
   MODAL
============================================================ */

const Modal = ({ title, onClose, children, size = "md" }) => {
  const width = size === "lg" ? "max-w-3xl" : "max-w-lg";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4">
      <div
        className={`flex max-h-[95vh] w-full ${width} flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl`}
      >
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>

          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={19} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
};

/* ============================================================
   MODAL ACTIONS
============================================================ */

const ModalActions = ({ onClose, submitLabel, disabled = false }) => (
  <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
    <button
      type="button"
      onClick={onClose}
      className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
    >
      Cancel
    </button>

    <button
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Save size={17} />
      {submitLabel}
    </button>
  </div>
);

/* ============================================================
   COURSE PREVIEW
============================================================ */

const CoursePreview = ({ course, modules, onClose }) => {
  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#B00000]">
              Student Preview
            </p>

            <h2 className="mt-1 text-lg font-bold text-gray-900">
              {course.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <X size={17} />
            Close Preview
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main>
            <div className="rounded-3xl bg-[#1E3A8A] p-6 text-white sm:p-10">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                {course.category}
              </span>

              <h1 className="mt-5 text-3xl font-bold sm:text-4xl">
                {course.title}
              </h1>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                {course.description}
              </p>

              <div className="mt-6 flex flex-wrap gap-3 text-xs">
                <span className="rounded-full bg-white/10 px-3 py-2">
                  {course.level}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-2">
                  {course.duration}
                </span>

                <span className="rounded-full bg-white/10 px-3 py-2">
                  {modules.length} Modules
                </span>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900">
                Course Curriculum
              </h2>

              <div className="mt-4 space-y-3">
                {modules.map((courseModule, moduleIndex) => (
                  <div
                    key={courseModule.id}
                    className="overflow-hidden rounded-2xl border border-gray-200 bg-white"
                  >
                    <div className="bg-gray-50 p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#B00000] text-xs font-bold text-white">
                          {moduleIndex + 1}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-gray-900">
                            {courseModule.title}
                          </h3>

                          <p className="mt-1 text-xs text-gray-500">
                            {courseModule.lessons.length} lessons
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {courseModule.lessons.map((lesson) => (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-3 p-4"
                        >
                          <PlayCircle
                            size={18}
                            className="shrink-0 text-[#B00000]"
                          />

                          <span className="min-w-0 flex-1 text-sm font-medium text-gray-700">
                            {lesson.title}
                          </span>

                          <span className="text-xs text-gray-400">
                            {lesson.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>

          <aside>
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900">
                Course Summary
              </h3>

              <div className="mt-5 space-y-4">
                <SidebarInfo label="Level" value={course.level} />

                <SidebarInfo label="Duration" value={course.duration} />

                <SidebarInfo label="Modules" value={modules.length} />

                <SidebarInfo
                  label="Lessons"
                  value={modules.reduce(
                    (sum, courseModule) => sum + courseModule.lessons.length,
                    0,
                  )}
                />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};
