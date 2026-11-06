import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  HelpCircle,
  Loader2,
  Menu,
  Play,
  PlayCircle,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { courseApi } from "../../api/courseApi";

/* ============================================================
   HELPERS
============================================================ */

// Only ever link to normal web addresses (never javascript: and similar).
const safeUrl = (value) => {
  const url = String(value || "").trim();
  return /^https?:\/\//i.test(url) ? url : "";
};

// Returns an embeddable player URL for YouTube / Vimeo links, else null.
const getEmbedUrl = (value) => {
  const url = safeUrl(value);
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = parsed.pathname.replace("/", "");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = parsed.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
      if (parsed.pathname.startsWith("/embed/")) return url;
    }

    if (host === "vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id)
        ? `https://player.vimeo.com/video/${id}`
        : null;
    }
  } catch {
    return null;
  }

  return null;
};

const normalizeModules = (serverModules = []) =>
  serverModules.map((courseModule) => ({
    id: String(courseModule.id || courseModule._id),
    title: courseModule.title || "",
    description: courseModule.description || "",
    lessons: (courseModule.lessons || []).map((lesson) => ({
      id: String(lesson.id || lesson._id),
      title: lesson.title || "",
      type: lesson.type || "Video",
      duration: lesson.duration || "",
      description: lesson.description || "",
      content: lesson.content || "",
      isPreview: Boolean(lesson.isPreview),
      resources: (lesson.resources || []).map((resource) => ({
        id: String(resource.id || resource._id),
        name: resource.name || "",
        type: resource.type || "Resource",
        url: resource.url || "",
      })),
    })),
  }));

const lessonTypeIcon = (type) => {
  if (type === "Assignment") return ClipboardList;
  if (type === "Quiz") return HelpCircle;
  if (type === "Document" || type === "Text") return FileText;
  if (type === "External Link") return ExternalLink;
  return PlayCircle;
};

/* ============================================================
   COURSE PLAYER
============================================================ */

const CoursePlayer = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { user } = useSelector((state) => state.auth);

  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [canTrack, setCanTrack] = useState(false);
  const [completedLessons, setCompletedLessons] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [marking, setMarking] = useState(false);

  const [activeLessonId, setActiveLessonId] = useState(null);
  const [openModules, setOpenModules] = useState({});
  const [showCurriculum, setShowCurriculum] = useState(false);
  const [activeTab, setActiveTab] = useState("video");

  const backPath =
    user?.role === "admin"
      ? "/dashboard/admin/courses"
      : user?.role === "instructor"
        ? "/dashboard/instructor/courses"
        : "/dashboard/student/courses";

  /* ----------------------------------------------------------
     LOAD COURSE + PROGRESS FROM THE DATABASE
  ---------------------------------------------------------- */

  const loadCourse = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await courseApi.learn(courseId);
      const loadedModules = normalizeModules(data.course.modules);
      const lessons = loadedModules.flatMap((item) => item.lessons);
      const lessonIds = new Set(lessons.map((lesson) => lesson.id));

      const completed = (data.progress?.completedLessonIds || []).filter((id) =>
        lessonIds.has(id),
      );

      // Resume at the first lesson that isn't finished yet.
      const resumeLesson =
        lessons.find((lesson) => !completed.includes(lesson.id)) || lessons[0];

      const resumeModule = loadedModules.find((item) =>
        item.lessons.some((lesson) => lesson.id === resumeLesson?.id),
      );

      setCourse(data.course);
      setModules(loadedModules);
      setCanTrack(Boolean(data.progress?.canTrack));
      setCompletedLessons(completed);
      setActiveLessonId(resumeLesson?.id || null);
      setOpenModules(
        Object.fromEntries(
          loadedModules.map((item, index) => [
            item.id,
            resumeModule ? item.id === resumeModule.id : index === 0,
          ]),
        ),
      );
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
     DERIVED VALUES
  ---------------------------------------------------------- */

  const allLessons = useMemo(
    () => modules.flatMap((courseModule) => courseModule.lessons),
    [modules],
  );

  const activeIndex = Math.max(
    0,
    allLessons.findIndex((lesson) => lesson.id === activeLessonId),
  );

  const activeLesson = allLessons[activeIndex] || null;
  const isActiveComplete = Boolean(
    activeLesson && completedLessons.includes(activeLesson.id),
  );

  const progress = allLessons.length
    ? Math.round((completedLessons.length / allLessons.length) * 100)
    : 0;

  const activeUrl = safeUrl(activeLesson?.content);
  const embedUrl =
    activeLesson?.type === "Video" ? getEmbedUrl(activeLesson.content) : null;

  /* ----------------------------------------------------------
     ACTIONS
  ---------------------------------------------------------- */

  const markComplete = async () => {
    if (!activeLesson || isActiveComplete || marking) return;

    // Instructors and admins can look around, but nothing is recorded.
    if (!canTrack) {
      setCompletedLessons((current) => [...current, activeLesson.id]);
      toast.info("Preview only — progress isn't saved.");
      return;
    }

    setMarking(true);

    try {
      const { data } = await courseApi.completeLesson(
        courseId,
        activeLesson.id,
      );
      setCompletedLessons(data.completedLessonIds || []);
      toast.success("Lesson marked as complete.");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Couldn't save your progress.",
      );
    } finally {
      setMarking(false);
    }
  };

  const openLesson = (lessonId, moduleId) => {
    setActiveLessonId(lessonId);
    setOpenModules((current) => ({ ...current, [moduleId]: true }));
    setShowCurriculum(false);
    setActiveTab("video");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goToLesson = (direction) => {
    const nextIndex = activeIndex + direction;
    if (nextIndex < 0 || nextIndex >= allLessons.length) return;

    const nextLesson = allLessons[nextIndex];
    const nextModule = modules.find((courseModule) =>
      courseModule.lessons.some((lesson) => lesson.id === nextLesson.id),
    );

    if (nextModule) {
      openLesson(nextLesson.id, nextModule.id);
    }
  };

  /* ----------------------------------------------------------
     LOADING / ERROR / EMPTY
  ---------------------------------------------------------- */

  if (loading && !course) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-slate-100 text-sm text-gray-500">
        <Loader2 size={20} className="animate-spin" />
        Loading course…
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-primary">
            <AlertCircle size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Couldn't open this course
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {loadError || "We could not find this course."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={loadCourse}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => navigate(backPath)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
            >
              <ArrowLeft size={17} />
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const instructorName =
    typeof course.instructor === "object" ? course.instructor?.name : "";

  return (
    <div className="min-h-screen bg-slate-100 text-gray-900">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
        <button
          type="button"
          onClick={() => navigate(backPath)}
          className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-gray-700"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <button
          type="button"
          onClick={() => setShowCurriculum(true)}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-secondary px-3 py-2 text-sm font-semibold text-white"
        >
          <Menu size={17} />
          Curriculum
        </button>
      </header>

      <div className="flex min-h-screen">
        <main className="min-w-0 flex-1">
          <div className="mx-auto max-w-[1800px] px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
            {/* Preview notice */}
            {!canTrack && (
              <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <p>
                  You're previewing this course as{" "}
                  {user?.role === "admin" ? "an admin" : "its instructor"}.
                  Lesson progress is not saved.
                </p>
              </div>
            )}

            {/* Course header */}
            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex min-w-0 items-start gap-4">
                  <button
                    type="button"
                    onClick={() => navigate(backPath)}
                    className="mt-1 hidden shrink-0 cursor-pointer items-center gap-1 text-xs font-semibold text-gray-500 hover:text-primary sm:flex"
                  >
                    <ArrowLeft size={15} />
                    Back
                  </button>

                  <div className="flex min-w-0 gap-3">
                    <div className="hidden h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-linear-to-br from-[#1E3A8A] to-[#B00000] sm:block">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-white">
                          <BookOpen size={25} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-secondary">
                          {course.category}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-gray-600">
                          {course.level}
                        </span>
                      </div>

                      <h1 className="mt-2 truncate text-xl font-extrabold tracking-tight sm:text-2xl">
                        {course.title}
                      </h1>

                      {instructorName && (
                        <p className="mt-1 text-xs text-gray-500">
                          By {instructorName}
                        </p>
                      )}

                      <div className="mt-3 flex items-center gap-3">
                        <div className="h-2 w-40 overflow-hidden rounded-full bg-gray-100 sm:w-64">
                          <div
                            className="h-full rounded-full bg-secondary transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-primary">
                          {progress}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>
                    {allLessons.length}{" "}
                    {allLessons.length === 1 ? "lesson" : "lessons"}
                  </span>
                  <span>•</span>
                  <span>{course.duration || "Self-paced"}</span>
                </div>
              </div>
            </section>

            {allLessons.length === 0 ? (
              <div className="mt-5 rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                  <BookOpen size={26} />
                </div>
                <h2 className="mt-4 text-lg font-bold text-gray-900">
                  No lessons yet
                </h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  This course doesn't have any lessons yet.
                  {user?.role === "instructor" &&
                    " Add modules and lessons in the Course Builder."}
                </p>
                {user?.role === "instructor" && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/dashboard/instructor/courses/${courseId}/builder`,
                      )
                    }
                    className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white"
                  >
                    Open Course Builder
                  </button>
                )}
              </div>
            ) : (
              <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
                {/* Main lesson area */}
                <section className="min-w-0">
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {/* Lesson tabs */}
                    <div className="flex overflow-x-auto border-b border-gray-200 px-3 sm:px-5">
                      {[
                        ["video", Play, "Lesson"],
                        ["notes", FileText, "Notes"],
                        ["resources", FolderOpen, "Resources"],
                      ].map(([tab, Icon, label]) => (
                        <button
                          key={tab}
                          type="button"
                          onClick={() => setActiveTab(tab)}
                          className={`relative flex shrink-0 cursor-pointer items-center gap-2 px-4 py-4 text-sm font-semibold transition sm:px-5 ${
                            activeTab === tab
                              ? "text-secondary"
                              : "text-gray-500 hover:text-gray-800"
                          }`}
                        >
                          <Icon size={17} />
                          {label}
                          {activeTab === tab && (
                            <span className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary" />
                          )}
                        </button>
                      ))}
                    </div>

                    {activeTab === "video" && (
                      <div className="p-3 sm:p-5">
                        <div className="relative aspect-video overflow-hidden rounded-2xl bg-black">
                          {activeLesson?.type === "Video" && embedUrl ? (
                            <iframe
                              src={embedUrl}
                              title={activeLesson.title}
                              className="h-full w-full"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                          ) : activeLesson?.type === "Video" && activeUrl ? (
                            <video
                              key={activeUrl}
                              src={activeUrl}
                              controls
                              className="h-full w-full"
                            >
                              Your browser can't play this video.
                            </video>
                          ) : (
                            <div className="flex h-full flex-col items-center justify-center bg-linear-to-br from-[#1E3A8A] to-[#B00000] p-6 text-center text-white">
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                                <Play size={28} fill="currentColor" />
                              </div>
                              <h2 className="mt-5 max-w-xl text-xl font-bold sm:text-2xl">
                                {activeLesson?.title || "Lesson"}
                              </h2>
                              <p className="mt-2 max-w-lg text-sm leading-6 text-white/80">
                                {activeLesson?.type === "Text"
                                  ? "This lesson is text-based. Open the Notes tab to read it."
                                  : activeLesson?.type === "Quiz"
                                    ? "Quiz questions will appear here."
                                    : activeLesson?.type === "Assignment"
                                      ? "Assignment details will appear here."
                                      : activeLesson?.type === "Video"
                                        ? "No video has been added to this lesson yet."
                                        : "Open the lesson using the button below."}
                              </p>

                              {(activeLesson?.type === "Document" ||
                                activeLesson?.type === "External Link") &&
                                activeUrl && (
                                  <a
                                    href={activeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#1E3A8A]"
                                  >
                                    <ExternalLink size={17} />
                                    {activeLesson.type === "Document"
                                      ? "Open document"
                                      : "Open lesson"}
                                  </a>
                                )}
                            </div>
                          )}
                        </div>

                        {activeLesson?.type === "Video" &&
                          activeUrl &&
                          !embedUrl && (
                            <p className="mt-3 text-xs text-gray-400">
                              Video not playing?{" "}
                              <a
                                href={activeUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-secondary hover:underline"
                              >
                                Open it in a new tab
                              </a>
                              .
                            </p>
                          )}
                      </div>
                    )}

                    {activeTab === "notes" && (
                      <div className="min-h-75 p-5 sm:p-7">
                        <div className="max-w-3xl">
                          <p className="text-xs font-bold uppercase tracking-wider text-primary">
                            Lesson Notes
                          </p>
                          <h2 className="mt-2 text-2xl font-extrabold">
                            {activeLesson?.title}
                          </h2>
                          <p className="mt-3 text-sm leading-7 text-gray-600">
                            {activeLesson?.description ||
                              "No lesson notes have been added yet."}
                          </p>

                          {activeLesson?.type === "Text" &&
                            activeLesson.content && (
                              <div className="mt-6 whitespace-pre-wrap rounded-2xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">
                                {activeLesson.content}
                              </div>
                            )}
                        </div>
                      </div>
                    )}

                    {activeTab === "resources" && (
                      <div className="min-h-75 p-5 sm:p-7">
                        <h2 className="text-xl font-bold">Lesson Resources</h2>
                        {activeLesson?.resources?.length ? (
                          <div className="mt-5 space-y-3">
                            {activeLesson.resources.map((resource) => {
                              const href = safeUrl(resource.url);

                              return (
                                <div
                                  key={resource.id}
                                  className="flex items-center gap-3 rounded-xl border border-gray-200 p-4"
                                >
                                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-primary">
                                    <FileText size={18} />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-gray-800">
                                      {resource.name}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {href
                                        ? resource.type
                                        : "No file attached"}
                                    </p>
                                  </div>
                                  {href && (
                                    <a
                                      href={href}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                                      aria-label={`Open ${resource.name}`}
                                    >
                                      <Download size={17} />
                                    </a>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-5 rounded-2xl bg-gray-50 p-8 text-center text-sm text-gray-500">
                            No resources have been added to this lesson.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Lesson information */}
                    <div className="border-t border-gray-100 p-5 sm:p-7">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">
                              Lesson {activeIndex + 1} of {allLessons.length}
                            </span>
                            {activeLesson?.duration && (
                              <span className="text-xs text-gray-400">
                                {activeLesson.duration}
                              </span>
                            )}
                          </div>
                          <h2 className="mt-2 text-xl font-extrabold sm:text-2xl">
                            {activeLesson?.title || "Lesson"}
                          </h2>
                          <p className="mt-2 max-w-3xl text-sm leading-7 text-gray-600">
                            {activeLesson?.description ||
                              "No description has been added to this lesson."}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={markComplete}
                          disabled={isActiveComplete || marking}
                          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white disabled:cursor-default ${
                            isActiveComplete
                              ? "bg-green-600"
                              : "bg-secondary hover:bg-blue-900 disabled:opacity-70"
                          }`}
                        >
                          {marking ? (
                            <Loader2 size={17} className="animate-spin" />
                          ) : (
                            <Check size={17} />
                          )}
                          {isActiveComplete
                            ? "Completed"
                            : marking
                              ? "Saving…"
                              : "Mark Complete"}
                        </button>
                      </div>

                      <div className="mt-7 flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => goToLesson(-1)}
                          disabled={activeIndex === 0}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ArrowLeft size={17} />
                          Previous Lesson
                        </button>

                        <button
                          type="button"
                          onClick={() => goToLesson(1)}
                          disabled={activeIndex === allLessons.length - 1}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          Next Lesson
                          <ArrowRight size={17} />
                        </button>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Desktop curriculum */}
                <aside className="hidden xl:block">
                  <CurriculumPanel
                    modules={modules}
                    course={course}
                    progress={progress}
                    totalLessons={allLessons.length}
                    activeLessonId={activeLessonId}
                    completedLessons={completedLessons}
                    openModules={openModules}
                    setOpenModules={setOpenModules}
                    onOpenLesson={openLesson}
                  />
                </aside>
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Mobile curriculum drawer */}
      {showCurriculum && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            aria-label="Close curriculum"
            onClick={() => setShowCurriculum(false)}
            className="absolute inset-0 bg-black/50"
          />

          <div className="absolute right-0 top-0 flex h-full w-[min(92vw,390px)] flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Course Curriculum
                </p>
                <h2 className="mt-1 font-bold text-gray-900">{course.title}</h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCurriculum(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg hover:bg-gray-100"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <CurriculumPanel
                modules={modules}
                course={course}
                progress={progress}
                totalLessons={allLessons.length}
                activeLessonId={activeLessonId}
                completedLessons={completedLessons}
                openModules={openModules}
                setOpenModules={setOpenModules}
                onOpenLesson={openLesson}
                mobile
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   CURRICULUM PANEL
============================================================ */

const CurriculumPanel = ({
  modules,
  course,
  progress,
  totalLessons,
  activeLessonId,
  completedLessons,
  openModules,
  setOpenModules,
  onOpenLesson,
  mobile = false,
}) => {
  const toggleModule = (moduleId) => {
    setOpenModules((current) => ({
      ...current,
      [moduleId]: !current[moduleId],
    }));
  };

  return (
    <div
      className={`${mobile ? "" : "sticky top-6"} overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm`}
    >
      <div className="border-b border-gray-200 p-5">
        <h2 className="font-bold text-gray-900">{course.title}</h2>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-[#1E3A8A] transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>{progress}% complete</span>
          <span>
            {completedLessons.length} of {totalLessons} lessons
          </span>
        </div>
      </div>

      <div className="max-h-[calc(100vh-180px)] overflow-y-auto">
        {modules.map((courseModule, moduleIndex) => (
          <div
            key={courseModule.id}
            className="border-b border-gray-100 last:border-b-0"
          >
            <button
              type="button"
              onClick={() => toggleModule(courseModule.id)}
              className="flex w-full items-center gap-3 p-4 text-left hover:bg-gray-50"
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[11px] font-bold text-[#1E3A8A]">
                {moduleIndex + 1}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-gray-800">
                  {courseModule.title}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {courseModule.lessons.length}{" "}
                  {courseModule.lessons.length === 1 ? "lesson" : "lessons"}
                </p>
              </div>
              {openModules[courseModule.id] ? (
                <ChevronDown size={17} />
              ) : (
                <ChevronRight size={17} />
              )}
            </button>

            {openModules[courseModule.id] && (
              <div className="pb-2">
                {courseModule.lessons.map((lesson, lessonIndex) => {
                  const Icon = lessonTypeIcon(lesson.type);
                  const active = lesson.id === activeLessonId;
                  const complete = completedLessons.includes(lesson.id);

                  return (
                    <button
                      type="button"
                      key={lesson.id}
                      onClick={() => onOpenLesson(lesson.id, courseModule.id)}
                      className={`flex w-full items-center gap-3 px-4 py-3 pl-14 text-left transition ${
                        active
                          ? "bg-blue-50 text-[#1E3A8A]"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border ${
                          complete
                            ? "border-green-200 bg-green-50 text-green-600"
                            : active
                              ? "border-blue-200 bg-white text-[#1E3A8A]"
                              : "border-gray-200 bg-white text-gray-400"
                        }`}
                      >
                        {complete ? <Check size={14} /> : <Icon size={14} />}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-xs font-semibold">
                          {lesson.title}
                        </p>
                        <p className="mt-1 text-[10px] text-gray-400">
                          {moduleIndex + 1}.{lessonIndex + 1}{" "}
                          {lesson.duration ? `• ${lesson.duration}` : ""}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoursePlayer;
