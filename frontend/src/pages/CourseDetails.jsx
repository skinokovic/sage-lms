import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  ChevronDown,
  FileText,
  Heart,
  GraduationCap,
  Lightbulb,
  ListChecks,
  LockKeyhole,
  ListVideo,
  Loader2,
  PlayCircle,
  X,
  ShieldCheck,
  ShoppingCart,
  Star,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";
import axiosClient from "../api/axiosClient";

import Navbar from "../components/Navbar";
import CourseReviews from "../components/reviews/CourseReviews";
import Footer from "../components/Footer";
import useEnrolledCourses, { courseLearnPath } from "../hooks/userEnrollment";

const CART_KEY = "sage_cart";
const WISHLIST_KEY = "sage_wishlist";

// Normalize the public API response while keeping the current page's data shape.
const normalizeCourse = (raw) => {
  if (!raw) return null;

  const instructorRaw =
    raw.instructor && typeof raw.instructor === "object" ? raw.instructor : {};
  const rawModules = Array.isArray(raw.modules)
    ? raw.modules
    : Array.isArray(raw.curriculum)
      ? raw.curriculum
      : Array.isArray(raw.sections)
        ? raw.sections
        : [];

  const modules = rawModules.map((module, index) => {
    const rawLessons = Array.isArray(module.lessons)
      ? module.lessons
      : Array.isArray(module.items)
        ? module.items
        : Array.isArray(module.contents)
          ? module.contents
          : [];

    return {
      ...module,
      id: module._id || module.id || `module-${index + 1}`,
      number: module.number || module.order || index + 1,
      title: module.title || module.name || `Module ${index + 1}`,
      description: module.description || "",
      // Keep the complete lesson object. The old code converted lessons to
      // title strings, which discarded video URLs, type, duration and resources.
      lessons: rawLessons.map((lesson, lessonIndex) => {
        if (typeof lesson === "string") {
          return {
            id: `lesson-${index + 1}-${lessonIndex + 1}`,
            title: lesson,
            type: "Lesson",
            duration: "",
            description: "",
            content: "",
            videoUrl: "",
            isPreview: false,
            resources: [],
          };
        }

        const type = lesson?.type || lesson?.lessonType || "Lesson";
        const content = lesson?.content || lesson?.body || "";
        const videoUrl =
          lesson?.videoUrl ||
          lesson?.videoURL ||
          lesson?.video?.url ||
          lesson?.url ||
          (String(type).toLowerCase() === "video" ? content : "");

        return {
          ...lesson,
          id:
            lesson?._id ||
            lesson?.id ||
            `lesson-${index + 1}-${lessonIndex + 1}`,
          title: lesson?.title || lesson?.name || `Lesson ${lessonIndex + 1}`,
          type,
          duration: lesson?.duration || lesson?.length || "",
          description: lesson?.description || "",
          content,
          videoUrl: typeof videoUrl === "string" ? videoUrl.trim() : "",
          isPreview: Boolean(lesson?.isPreview ?? lesson?.freePreview),
          resources: Array.isArray(lesson?.resources) ? lesson.resources : [],
        };
      }),
    };
  });

  // Course builder versions may store these as arrays, newline-separated text,
  // or objects with a label/text/description property. Normalize without
  // inventing any course information that is not present in the API response.
  const normalizeTextList = (value) => {
    const values = Array.isArray(value)
      ? value
      : typeof value === "string"
        ? value.split(/\r?\n|[•;]\s*/)
        : value == null
          ? []
          : [value];

    return values
      .map((item) => {
        if (typeof item === "string" || typeof item === "number") {
          return String(item)
            .trim()
            .replace(/^[-*•]\s*/, "");
        }
        if (item && typeof item === "object") {
          const text =
            item.text ||
            item.title ||
            item.name ||
            item.description ||
            item.objective ||
            item.outcome ||
            item.requirement ||
            item.label ||
            item.value;
          return typeof text === "string" ? text.trim() : "";
        }
        return "";
      })
      .filter(Boolean);
  };

  const firstPopulatedList = (keys) => {
    for (const key of keys) {
      const list = normalizeTextList(raw[key]);
      if (list.length) return list;
    }
    return [];
  };

  const learningOutcomes = firstPopulatedList([
    "learningOutcomes",
    "learningObjectives",
    "whatYouWillLearn",
    "objectives",
    "courseObjectives",
    "learning_outcomes",
    "learning_objectives",
  ]);
  const requirements = firstPopulatedList([
    "requirements",
    "prerequisites",
    "requiredSkills",
    "entryRequirements",
    "courseRequirements",
    "coursePrerequisites",
    "course_requirements",
    "course_prerequisites",
  ]);
  const lessonCount = modules.reduce(
    (total, module) => total + module.lessons.length,
    0,
  );
  const price = Number(raw.price ?? raw.courseFee ?? 0);
  const originalPrice = Number(
    raw.originalPrice ?? raw.compareAtPrice ?? price,
  );
  const instructorName =
    typeof raw.instructor === "string"
      ? raw.instructor
      : instructorRaw.name || raw.instructorName || "SAGE Instructor";

  return {
    ...raw,
    id: raw._id || raw.id,
    title: raw.title || raw.name || "Untitled course",
    category:
      typeof raw.category === "object"
        ? raw.category?.name || "General"
        : raw.category || "General",
    level: raw.level || raw.difficulty || "All levels",
    price,
    originalPrice,
    students: Number(
      raw.students ?? raw.studentCount ?? raw.enrolledStudents?.length ?? 0,
    ),
    duration: raw.duration || raw.estimatedDuration || "Self-paced",
    lessons: Number(raw.lessonsCount ?? raw.totalLessons ?? lessonCount),
    language: raw.language || "English",
    image: raw.thumbnail || raw.image || raw.thumbnailUrl || "",
    about:
      raw.description ||
      raw.about ||
      raw.shortDescription ||
      "Course information will be added soon.",
    learningOutcomes,
    requirements,
    instructor: {
      name: instructorName,
      title:
        instructorRaw.title || instructorRaw.jobTitle || "Course Instructor",
      avatar:
        instructorRaw.avatarUrl ||
        instructorRaw.avatar ||
        instructorRaw.profileImage ||
        "",
      // Instructor rating comes from student reviews (not the course rating)
      rating: Number(instructorRaw.rating ?? 0),
      ratingCount: Number(instructorRaw.ratingCount || 0),
      courseCount: Number(instructorRaw.courseCount || 0),
      studentCount: Number(instructorRaw.studentCount || raw.students || 0),
      bio:
        instructorRaw.bio ||
        instructorRaw.about ||
        "Your instructor will guide you through the course content.",
    },
    modules,
  };
};

const getVideoSource = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  const url = rawUrl.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").toLowerCase();

    if (host === "youtu.be") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id
        ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` }
        : null;
    }

    if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      let id = parsed.searchParams.get("v");
      if (!id) {
        const parts = parsed.pathname.split("/").filter(Boolean);
        const marker = parts.findIndex((part) =>
          ["embed", "shorts", "live"].includes(part),
        );
        if (marker >= 0) id = parts[marker + 1];
      }
      return id
        ? { kind: "embed", src: `https://www.youtube-nocookie.com/embed/${id}` }
        : null;
    }

    if (host === "vimeo.com" || host === "player.vimeo.com") {
      const id = parsed.pathname.split("/").filter(Boolean).pop();
      return id && /^\d+$/.test(id)
        ? { kind: "embed", src: `https://player.vimeo.com/video/${id}` }
        : { kind: "link", src: url };
    }

    if (/\.(mp4|webm|ogg)(?:$|\?)/i.test(url))
      return { kind: "video", src: url };
    return { kind: "link", src: url };
  } catch {
    return null;
  }
};

const CourseCurriculum = ({ modules = [] }) => {
  const [activeVideo, setActiveVideo] = useState(null);
  const totalLessons = modules.reduce(
    (total, module) =>
      total + (Array.isArray(module.lessons) ? module.lessons.length : 0),
    0,
  );

  if (!modules.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-surface-muted p-6 text-center">
        <BookOpen className="mx-auto text-body" size={28} />
        <p className="mt-3 font-semibold text-heading">
          Curriculum coming soon
        </p>
        <p className="mt-1 text-sm text-body">
          The instructor has not added module details yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {modules.map((module, moduleIndex) => {
        const lessons = Array.isArray(module.lessons) ? module.lessons : [];
        const videoCount = lessons.filter(
          (lesson) => String(lesson.type).toLowerCase() === "video",
        ).length;

        return (
          <details
            key={module.id || moduleIndex}
            className="group overflow-hidden rounded-2xl border border-line bg-surface shadow-sm transition-shadow hover:shadow-md"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-4 transition hover:bg-surface-muted sm:p-5 [&::-webkit-details-marker]:hidden">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-wide text-primary">
                  Module {module.number || moduleIndex + 1}
                </p>
                <h3 className="mt-1 font-bold text-heading">{module.title}</h3>
                {module.description && (
                  <p className="mt-1 text-sm leading-6 text-body">
                    {module.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-body">
                  {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
                  {videoCount > 0
                    ? ` · ${videoCount} ${videoCount === 1 ? "video" : "videos"}`
                    : ""}
                </p>
              </div>
              <ChevronDown
                size={19}
                className="shrink-0 text-body transition-transform group-open:rotate-180"
              />
            </summary>

            <div className="border-t border-line">
              {lessons.length === 0 ? (
                <p className="p-4 text-sm text-body">
                  No lessons have been added to this module yet.
                </p>
              ) : (
                <div className="divide-y divide-line">
                  {lessons.map((lesson, lessonIndex) => {
                    const lessonType = String(lesson.type || "Lesson");
                    const isVideo = lessonType.toLowerCase() === "video";
                    const video = isVideo
                      ? getVideoSource(lesson.videoUrl || lesson.content)
                      : null;

                    return (
                      <article
                        key={lesson.id || lessonIndex}
                        className="flex items-center gap-3 p-4 transition-colors hover:bg-surface-muted/70 sm:px-5"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isVideo ? "bg-primary/10 text-primary" : "bg-surface-muted text-secondary"}`}
                        >
                          {isVideo ? (
                            <PlayCircle size={19} />
                          ) : (
                            <FileText size={18} />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold text-heading">
                              {lesson.title || `Lesson ${lessonIndex + 1}`}
                            </h4>
                            {lesson.isPreview && (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                                Free preview
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-body">
                            <span>{lessonType}</span>
                            {lesson.duration && (
                              <>
                                <span>·</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 size={12} />
                                  {lesson.duration}
                                </span>
                              </>
                            )}
                          </div>
                          {lesson.description && (
                            <p className="mt-1 line-clamp-2 text-sm leading-5 text-body">
                              {lesson.description}
                            </p>
                          )}
                        </div>

                        {isVideo && (
                          <button
                            type="button"
                            disabled={!lesson.isPreview}
                            onClick={() => {
                              if (!lesson.isPreview) return;
                              setActiveVideo({ lesson, video });
                            }}
                            aria-label={
                              lesson.isPreview
                                ? `Play ${lesson.title || "lesson video"}`
                                : `${lesson.title || "Lesson video"} is not available in free preview`
                            }
                            title={
                              lesson.isPreview
                                ? "Play free preview"
                                : "Available to enrolled students only"
                            }
                            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition focus:outline-none focus:ring-2 focus:ring-primary/30 ${
                              lesson.isPreview
                                ? "border-primary/20 bg-primary/5 text-primary hover:border-primary hover:bg-primary hover:text-white cursor-pointer"
                                : "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 opacity-70"
                            }`}
                          >
                            <ListVideo size={20} />
                          </button>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </details>
        );
      })}
      <p className="text-xs text-body">
        {modules.length} modules · {totalLessons} lessons in this course.
      </p>

      {activeVideo && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:p-6"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveVideo(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="lesson-video-title"
            className="w-full max-w-4xl overflow-hidden rounded-2xl bg-surface shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line p-4 sm:p-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">
                  Course lesson
                </p>
                <h3
                  id="lesson-video-title"
                  className="mt-1 text-lg font-extrabold text-heading sm:text-xl"
                >
                  {activeVideo.lesson.title || "Lesson video"}
                </h3>
                {activeVideo.lesson.duration && (
                  <p className="mt-1 text-sm text-body">
                    Duration: {activeVideo.lesson.duration}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                aria-label="Close video player"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-body transition hover:bg-surface-muted hover:text-heading"
              >
                <X size={21} />
              </button>
            </div>

            {activeVideo.video?.kind === "embed" ? (
              <div className="aspect-video bg-black">
                <iframe
                  src={activeVideo.video.src}
                  title={activeVideo.lesson.title || "Course lesson video"}
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            ) : activeVideo.video?.kind === "video" ? (
              <video
                key={activeVideo.video.src}
                className="aspect-video w-full bg-black"
                controls
                autoPlay
              >
                <source src={activeVideo.video.src} />
                Your browser does not support embedded video.
              </video>
            ) : activeVideo.video?.kind === "link" ? (
              <div className="p-6 text-center sm:p-10">
                <PlayCircle className="mx-auto text-primary" size={42} />
                <p className="mt-3 font-semibold text-heading">
                  This video opens on an external site.
                </p>
                <a
                  href={activeVideo.video.src}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary/90"
                >
                  Open video <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <div className="p-6 text-center sm:p-10">
                <PlayCircle className="mx-auto text-body" size={42} />
                <p className="mt-3 font-semibold text-heading">
                  Video not available yet
                </p>
                <p className="mt-1 text-sm text-body">
                  A video link has not been added to this lesson.
                </p>
              </div>
            )}
            {activeVideo.lesson.description && (
              <div className="border-t border-line p-4 sm:p-5">
                <p className="text-sm leading-6 text-body">
                  {activeVideo.lesson.description}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

const readStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const formatMoney = (amount) => `₦${Number(amount || 0).toLocaleString()}`;

export default function CourseDetails() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [saved, setSaved] = useState(false);
  const [inCart, setInCart] = useState(false);

  // Which courses this student already owns, and one-click free enrollment
  const { isEnrolled, enrollFree, enrollingId } = useEnrolledCourses();

  useEffect(() => {
    let active = true;
    const loadCourse = async () => {
      if (!courseId) {
        setCourse(null);
        setLoadError("A course was not specified.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setLoadError("");
      try {
        const { data } = await axiosClient.get(`/courses/public/${courseId}`);
        const rawCourse =
          data?.course || data?.data?.course || data?.data || null;
        const normalized = normalizeCourse(rawCourse);
        if (!normalized) throw new Error("This course could not be found.");
        if (active) setCourse(normalized);
      } catch (error) {
        if (active) {
          setCourse(null);
          setLoadError(
            error.response?.data?.message ||
              error.message ||
              "We couldn't load this course. Please try again.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);

  useEffect(() => {
    if (!course?.id) return;
    const cart = readStorageArray(CART_KEY);
    const wishlist = readStorageArray(WISHLIST_KEY);
    setInCart(cart.some((item) => String(item.id) === String(course.id)));
    setSaved(wishlist.some((item) => String(item.id) === String(course.id)));
  }, [course?.id]);

  const enrolled = course ? isEnrolled(course.id) : false;
  const isFree = course ? Number(course.price || 0) === 0 : false;
  const enrolling = course ? enrollingId === String(course.id) : false;

  const savings = isFree
    ? 0
    : Math.max(
        Number(course?.originalPrice || 0) - Number(course?.price || 0),
        0,
      );
  const discount =
    !isFree && course?.originalPrice
      ? Math.round((savings / course.originalPrice) * 100)
      : 0;

  const buildCartItem = () => ({
    id: course.id,
    title: course.title,
    category: course.category,
    instructor: course.instructor?.name || "SAGE Instructor",
    image: course.image || "",
    price: Number(course.price || 0),
    originalPrice: Number(course.originalPrice || course.price || 0),
    duration: course.duration || "Self-paced",
    students: Number(course.students || 0),
    lessons: Number(course.lessons || 0),
    access: "Lifetime access",
  });

  const addToCart = ({ goToCart = false } = {}) => {
    // Owned and free courses never go through the cart.
    if (!course || enrolled || isFree) return;
    const cart = readStorageArray(CART_KEY);
    if (cart.some((item) => String(item.id) === String(course.id))) {
      setInCart(true);
      if (goToCart) navigate("/cart");
      else toast.info("This course is already in your cart.");
      return;
    }
    localStorage.setItem(CART_KEY, JSON.stringify([...cart, buildCartItem()]));
    window.dispatchEvent(new Event("sage-cart-updated"));
    setInCart(true);
    toast.success("Course added to cart.");
    if (goToCart) navigate("/cart");
  };

  const handleBuyNow = () => {
    if (!course || enrolled || isFree) return;
    addToCart();
    navigate("/checkout");
  };

  const handleWishlist = () => {
    if (!course) return;
    const wishlist = readStorageArray(WISHLIST_KEY);
    if (saved) {
      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(
          wishlist.filter((item) => String(item.id) !== String(course.id)),
        ),
      );
      setSaved(false);
      toast.info("Course removed from your wishlist.");
      return;
    }
    localStorage.setItem(
      WISHLIST_KEY,
      JSON.stringify([
        ...wishlist,
        {
          id: course.id,
          title: course.title,
          image: course.image,
          price: course.price,
        },
      ]),
    );
    setSaved(true);
    toast.success("Course saved to your wishlist.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="animate-pulse space-y-6">
            <div className="h-5 w-36 rounded bg-surface-muted" />
            <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
              <div className="space-y-4">
                <div className="h-10 max-w-xl rounded bg-surface-muted" />
                <div className="h-5 max-w-2xl rounded bg-surface-muted" />
                <div className="h-5 max-w-lg rounded bg-surface-muted" />
              </div>
              <div className="aspect-[16/10] rounded-2xl bg-surface-muted" />
            </div>
            <div className="h-48 rounded-2xl bg-surface-muted" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (loadError || !course) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-20 text-center sm:px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary">
            <BookOpen size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-heading">
            Course unavailable
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-body">
            {loadError || "This course may have been unpublished or removed."}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(0)}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Try again
            </button>
            <Link
              to="/courses"
              className="rounded-xl border border-line px-5 py-3 text-sm font-bold text-heading transition hover:border-primary hover:text-primary"
            >
              Back to courses
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-secondary via-secondary to-[#142b66] text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
          <Link
            to="/courses"
            className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-blue-100 transition hover:text-white"
          >
            <ArrowLeft size={17} /> Back to courses
          </Link>

          <div className="grid gap-8 lg:grid-cols-[1fr_390px] lg:items-center">
            <div className="max-w-3xl">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 ring-1 ring-white/10">
                  {course.category}
                </span>
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 ring-1 ring-white/10">
                  {course.level}
                </span>
                {isFree && (
                  <span className="rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white">
                    FREE
                  </span>
                )}
                {discount > 0 && (
                  <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                {course.title}
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                {course.about}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-blue-100">
                <span className="inline-flex items-center gap-2">
                  <Star size={17} className="fill-amber-400 text-amber-400" />
                  {course.reviewCount > 0 ? (
                    <>
                      <strong className="text-white">
                        {Number(course.rating).toFixed(1)}
                      </strong>
                      <a
                        href="#reviews"
                        className="underline-offset-2 hover:underline"
                      >
                        ({course.reviewCount}{" "}
                        {course.reviewCount === 1 ? "review" : "reviews"})
                      </a>
                    </>
                  ) : (
                    "No reviews yet"
                  )}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={17} />
                  {course.students}+ students
                </span>
                <span className="inline-flex items-center gap-2">
                  <Clock3 size={17} />
                  {course.duration}
                </span>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl bg-white text-heading shadow-2xl ring-1 ring-white/20">
              <div className="relative">
                <img
                  src={
                    course.image ||
                    "https://placehold.co/900x560?text=SAGE+Course"
                  }
                  alt={course.title}
                  className="aspect-[16/10] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <button
                  type="button"
                  onClick={handleWishlist}
                  aria-label={saved ? "Remove from wishlist" : "Save course"}
                  aria-pressed={saved}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-105"
                >
                  <Heart
                    size={19}
                    className={
                      saved ? "fill-primary text-primary" : "text-heading"
                    }
                  />
                </button>
                <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-lg bg-black/65 px-3 py-2 text-xs font-semibold text-white backdrop-blur">
                  <PlayCircle size={15} /> Preview course
                </div>
              </div>

              <div className="p-5 sm:p-6">
                {enrolled ? (
                  /* The student already owns this course */
                  <>
                    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-800">
                      <CheckCircle2 size={24} className="shrink-0" />
                      <div>
                        <p className="font-extrabold">You're enrolled</p>
                        <p className="mt-0.5 text-xs">
                          You have full access to this course.
                        </p>
                      </div>
                    </div>

                    <Link
                      to={courseLearnPath(course.id)}
                      className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover"
                    >
                      <PlayCircle size={18} />
                      Continue learning
                    </Link>
                  </>
                ) : isFree ? (
                  /* A free course: enroll with one click */
                  <>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-body">
                        Course fee
                      </p>
                      <p className="mt-1 text-2xl font-extrabold text-emerald-600">
                        Free
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => enrollFree(course)}
                      disabled={enrolling}
                      className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 size={17} className="animate-spin" />
                          Enrolling…
                        </>
                      ) : (
                        <>
                          Enroll for free <ArrowRight size={17} />
                        </>
                      )}
                    </button>

                    <p className="mt-2 text-center text-xs text-body">
                      No payment needed. Start learning right away.
                    </p>
                  </>
                ) : (
                  /* A paid course */
                  <>
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-body">
                          Course fee
                        </p>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="text-2xl font-extrabold text-primary">
                            {formatMoney(course.price)}
                          </span>
                          {course.originalPrice > course.price && (
                            <span className="text-sm text-body line-through">
                              {formatMoney(course.originalPrice)}
                            </span>
                          )}
                        </div>
                      </div>
                      {savings > 0 && (
                        <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-bold text-primary">
                          Save {formatMoney(savings)}
                        </span>
                      )}
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart({ goToCart: true })}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-3 py-3 text-sm font-bold text-primary transition hover:bg-red-50"
                      >
                        <ShoppingCart size={17} />{" "}
                        {inCart ? "View Cart" : "Add to Cart"}
                      </button>
                      <button
                        type="button"
                        onClick={handleBuyNow}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-3 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-hover"
                      >
                        Buy Now <ArrowRight size={17} />
                      </button>
                    </div>
                  </>
                )}

                <div className="mt-5 grid grid-cols-2 gap-3 border-t border-line pt-5 text-xs text-body">
                  <span className="inline-flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-600" />
                    Lifetime access
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Award size={15} className="text-secondary" />
                    Certificate
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <LockKeyhole size={15} className="text-secondary" />
                    {isFree || enrolled
                      ? "Learn at your pace"
                      : "Secure payment"}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <BookOpen size={15} className="text-secondary" />
                    {course.lessons} lessons
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
          <div className="space-y-10">
            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex items-start gap-4 border-b border-line bg-gradient-to-r from-emerald-50 to-surface px-5 py-5 sm:px-7">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <GraduationCap size={25} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-heading sm:text-2xl">
                    Learning objectives
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-body">
                    The skills and knowledge you can expect to gain from this
                    course.
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  {(course.objectives || []).length} outcomes
                </span>
              </div>
              {(course.objectives || []).length ? (
                <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
                  {course.objectives.map((item, index) => (
                    <div
                      key={`${index}-${item}`}
                      className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted/70 p-4 transition hover:border-emerald-200 hover:bg-emerald-50/50"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                        <CheckCircle2 size={16} />
                      </span>
                      <p className="text-sm leading-6 text-body">{item}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm leading-6 text-body">
                  Learning objectives have not been added to this course yet.
                </div>
              )}
            </section>

            <section>
              <h2 className="text-xl font-extrabold text-heading sm:text-2xl">
                About this course
              </h2>
              <p className="mt-4 text-sm leading-7 text-body sm:text-base">
                {course.about}
              </p>
            </section>

            <section>
              <div className="mb-5 flex items-end justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-heading sm:text-2xl">
                    Course curriculum
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    {course.modules.length} modules · {course.lessons} lessons ·{" "}
                    {course.duration}
                  </p>
                </div>
              </div>
              <CourseCurriculum modules={course.modules} />
            </section>

            <section className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
              <div className="flex items-start gap-4 border-b border-line bg-gradient-to-r from-blue-50 to-surface px-5 py-5 sm:px-7">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-secondary">
                  <ListChecks size={24} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-extrabold text-heading sm:text-2xl">
                    Prerequisites & requirements
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-body">
                    What you should have or know before you begin.
                  </p>
                </div>
                <span className="ml-auto rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-secondary">
                  {(course.requirements || []).length} items
                </span>
              </div>
              {(course.requirements || []).length ? (
                <ul className="space-y-3 p-5 sm:p-7">
                  {course.requirements.map((item, index) => (
                    <li
                      key={`${index}-${item}`}
                      className="flex items-start gap-3 rounded-xl border border-line bg-surface-muted/70 p-4"
                    >
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-secondary">
                        <CheckCircle2 size={16} />
                      </span>
                      <span className="text-sm leading-6 text-body">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-start gap-3 p-6 text-sm leading-6 text-body">
                  <Lightbulb
                    size={19}
                    className="mt-0.5 shrink-0 text-secondary"
                  />
                  <p>
                    No specific prerequisites have been listed. Check the course
                    overview for any additional guidance.
                  </p>
                </div>
              )}
            </section>

            {/* Student reviews + ratings (live from the backend) */}
            <CourseReviews
              courseId={course.id}
              instructorName={course.instructor.name}
            />
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                Your instructor
              </p>
              <div className="mt-5 flex items-center gap-4">
                {course.instructor.avatar ? (
                  <img
                    src={course.instructor.avatar}
                    alt={course.instructor.name}
                    className="h-16 w-16 rounded-full object-cover ring-4 ring-red-50"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-secondary text-lg font-extrabold text-white ring-4 ring-red-50">
                    {(course.instructor.name || "S").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-extrabold text-heading">
                    {course.instructor.name}
                  </h3>
                  <p className="mt-1 text-sm text-body">
                    {course.instructor.title}
                  </p>
                  <div className="mt-2 flex items-center gap-1">
                    <Star size={15} className="fill-amber-400 text-amber-400" />
                    {course.instructor.ratingCount > 0 ? (
                      <>
                        <span className="text-sm font-bold text-heading">
                          {Number(course.instructor.rating).toFixed(1)}
                        </span>
                        <span className="text-xs text-body">
                          ({course.instructor.ratingCount})
                        </span>
                      </>
                    ) : (
                      <span className="text-xs text-body">No ratings yet</span>
                    )}
                  </div>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-body">
                {course.instructor.bio}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xs text-body">Courses</p>
                  <p className="mt-1 font-extrabold text-heading">
                    {course.instructor.courseCount}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-muted p-3">
                  <p className="text-xs text-body">Students</p>
                  <p className="mt-1 font-extrabold text-heading">
                    {course.instructor.studentCount}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl bg-secondary p-5 text-white shadow-sm sm:p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck size={21} />
                </div>
                <div>
                  <p className="font-bold">Learn with confidence</p>
                  <p className="text-xs text-blue-200">
                    Designed for practical learning.
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm text-blue-100">
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  Lifetime course access
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  Certificate after completion
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 size={16} />
                  {isFree ? "No payment required" : "Secure online payment"}
                </div>
              </div>
            </section>

            <Link
              to="/courses"
              className="flex items-center justify-center gap-2 rounded-xl border border-line bg-surface px-5 py-3 text-sm font-bold text-heading transition hover:border-primary hover:text-primary"
            >
              Explore more courses <ArrowRight size={17} />
            </Link>
          </aside>
        </div>
      </main>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-body">
              {course.title}
            </p>
            <p
              className={`text-base font-extrabold ${
                enrolled || isFree ? "text-emerald-600" : "text-primary"
              }`}
            >
              {enrolled
                ? "Enrolled"
                : isFree
                  ? "Free"
                  : formatMoney(course.price)}
            </p>
          </div>

          {enrolled ? (
            <Link
              to={courseLearnPath(course.id)}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
            >
              <PlayCircle size={17} />
              Continue learning
            </Link>
          ) : isFree ? (
            <button
              type="button"
              onClick={() => enrollFree(course)}
              disabled={enrolling}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white disabled:opacity-70"
            >
              {enrolling ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Enrolling…
                </>
              ) : (
                <>
                  Enroll for free <ArrowRight size={17} />
                </>
              )}
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => addToCart({ goToCart: true })}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-primary px-3 py-3 text-sm font-bold text-primary"
              >
                <ShoppingCart size={17} />
                Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white"
              >
                Buy Now <ArrowRight size={17} />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="pb-20 lg:pb-0">
        <Footer />
      </div>
    </div>
  );
}
