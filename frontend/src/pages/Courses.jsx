import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  List,
  LayoutGrid,
  User,
  Presentation,
  ArrowRight,
  BookOpen,
  Award,
  CheckCircle2,
  GraduationCap,
  Sparkles,
  SlidersHorizontal,
  X,
  PlayCircle,
  Star,
  Clock3,
  ShieldCheck,
  RefreshCw,
  Tag,
} from "lucide-react";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BecomeInstructorCTA from "../components/BecomeInstructorCTA";

import { fetchPublishedCourses } from "../store/courseSlice";
import useEnrolledCourses, { courseLearnPath } from "../hooks/userEnrollment";

const PAGE_SIZE = 8;

const LEARNING_BENEFITS = [
  {
    icon: BookOpen,
    title: "Practical Learning",
    description:
      "Learn through structured courses designed around useful knowledge and real-world application.",
  },
  {
    icon: GraduationCap,
    title: "Expert-Led Courses",
    description:
      "Explore courses created by instructors to support your learning goals.",
  },
  {
    icon: Award,
    title: "Earn Certificates",
    description:
      "Complete your learning journey and celebrate your achievements.",
  },
  {
    icon: ShieldCheck,
    title: "Learn With Confidence",
    description:
      "Follow organized lessons and a clear, learner-focused experience.",
  },
];

const formatMoney = (amount) =>
  `₦${Number(amount || 0).toLocaleString("en-NG")}`;

// The price area of a course: "Enrolled" for a course the student owns,
// "Free" for a zero-price course, otherwise the price.
// `compact` makes the "Enrolled" pill smaller so it fits beside a button
// inside a course card without wrapping.
function CoursePrice({ price, enrolled, className = "", compact = false }) {
  if (enrolled) {
    return (
      <span
        className={`inline-flex min-w-0 items-center rounded-full bg-emerald-50 font-bold text-emerald-700 ${
          compact ? "gap-1 px-2.5 py-1 text-xs" : "gap-1.5 px-3 py-1.5 text-sm"
        }`}
      >
        <CheckCircle2 size={compact ? 13 : 15} className="shrink-0" />
        <span className="truncate">Enrolled</span>
      </span>
    );
  }

  return (
    <span className={className}>
      {Number(price || 0) === 0 ? "Free" : formatMoney(price)}
    </span>
  );
}

function CourseImage({ src, title, className = "" }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  if (!src || imageFailed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#B00000] text-white ${className}`}
      >
        <BookOpen size={38} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title || "Course thumbnail"}
      loading="lazy"
      onError={() => setImageFailed(true)}
      className={className}
    />
  );
}

function CourseRating({ rating, count = 0 }) {
  const value = Number(rating || 0);
  const reviewCount = Number(count || 0);

  if (!value) {
    return (
      <span className="whitespace-nowrap text-xs text-gray-500">
        Not rated yet
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-heading">
      <Star size={14} fill="currentColor" className="text-amber-500" />
      {value.toFixed(1)}
      {reviewCount > 0 && (
        <span className="text-xs font-normal text-body">
          ({reviewCount.toLocaleString()})
        </span>
      )}
    </span>
  );
}

// One shared size for the card's action button: same height everywhere,
// never wraps, never shrinks.
const CARD_ACTION =
  "inline-flex h-9 shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl bg-primary px-3 text-xs font-bold text-white transition-colors hover:bg-primary/90";

/**
 * Grid card. Every card is the same size regardless of its content:
 *   - category/level row, instructor and rating rows are one line each
 *     (clipped with an ellipsis if too long)
 *   - the title always reserves two lines
 *   - the footer is a fixed-height row that never wraps
 */
function CourseCard({ course, enrolled = false, fullWidth = false }) {
  return (
    <article
      className={`group flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
        fullWidth ? "w-full" : ""
      }`}
    >
      <Link
        to={`/courses/${course.id}`}
        className="block overflow-hidden bg-surface-muted"
      >
        <CourseImage
          src={course.image}
          title={course.title}
          className="aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        {/* Category + level: one line */}
        <div className="flex h-7 items-center gap-2 overflow-hidden">
          <span className="min-w-0 truncate rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            {course.category || "General"}
          </span>

          {course.level && (
            <span className="shrink-0 whitespace-nowrap text-xs text-body">
              {course.level}
            </span>
          )}
        </div>

        {/* Title: always two lines tall */}
        <Link to={`/courses/${course.id}`}>
          <h3 className="mt-2 line-clamp-2 h-12 overflow-hidden text-base font-bold leading-6 text-heading transition-colors group-hover:text-primary">
            {course.title}
          </h3>
        </Link>

        {/* Instructor: one line */}
        <p className="mt-2 h-5 truncate text-sm leading-5 text-body">
          By {course.instructorName}
        </p>

        {/* Rating + duration: one line */}
        <div className="mt-3 flex h-5 items-center gap-3 overflow-hidden">
          <CourseRating rating={course.rating} count={course.reviewCount} />

          {course.duration && (
            <span className="inline-flex min-w-0 items-center gap-1 text-xs text-body">
              <Clock3 size={13} className="shrink-0" />
              <span className="truncate">{course.duration}</span>
            </span>
          )}
        </div>

        {/* Footer: price/status on the left, button on the right */}
        <div className="mt-auto">
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-4">
            <CoursePrice
              price={course.price}
              enrolled={enrolled}
              compact
              className="min-w-0 truncate text-lg font-extrabold text-heading"
            />

            {enrolled ? (
              <Link to={courseLearnPath(course.id)} className={CARD_ACTION}>
                Continue learning
                <ArrowRight size={14} />
              </Link>
            ) : (
              <Link to={`/courses/${course.id}`} className={CARD_ACTION}>
                View course
                <ArrowRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function CourseListRow({ course, enrolled = false }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row">
      <Link
        to={`/courses/${course.id}`}
        className="block shrink-0 overflow-hidden rounded-xl bg-surface-muted sm:w-52"
      >
        <CourseImage
          src={course.image}
          title={course.title}
          className="aspect-[16/10] w-full object-cover sm:h-full sm:min-h-36"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
            {course.category || "General"}
          </span>

          {course.level && (
            <span className="text-xs text-body">{course.level}</span>
          )}
        </div>

        <Link to={`/courses/${course.id}`}>
          <h3 className="mt-2 text-lg font-bold text-heading transition-colors hover:text-primary">
            {course.title}
          </h3>
        </Link>

        <p className="mt-1 text-sm text-body">By {course.instructorName}</p>

        {course.description && (
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-body">
            {course.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <CourseRating rating={course.rating} count={course.reviewCount} />

            {course.duration && (
              <span className="inline-flex items-center gap-1 text-xs text-body">
                <Clock3 size={13} />
                {course.duration}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <CoursePrice
              price={course.price}
              enrolled={enrolled}
              className="text-lg font-extrabold text-heading"
            />

            {enrolled ? (
              <Link
                to={courseLearnPath(course.id)}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                Continue learning
                <ArrowRight size={15} />
              </Link>
            ) : (
              <Link
                to={`/courses/${course.id}`}
                className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                View
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Courses() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  const { user } = useSelector((state) => state.auth);

  // Which courses the logged-in student already owns
  const { isEnrolled } = useEnrolledCourses();

  // Public courses use their own state fields so they never overwrite
  // the admin/instructor course list stored in state.courses.items.
  const {
    publishedItems: courses = [],
    publishedStatus: status = "idle",
    publishedError: error = null,
  } = useSelector((state) => state.courses);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPublishedCourses());
    }
  }, [dispatch, status]);

  const urlQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(urlQuery);
  const [activeCategory, setActiveCategory] = useState(null);
  const [view, setView] = useState("grid");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [query, activeCategory]);

  const categories = useMemo(
    () =>
      [
        ...new Set(courses.map((course) => course.category).filter(Boolean)),
      ].sort((a, b) => a.localeCompare(b)),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return courses.filter((course) => {
      const matchesCategory =
        !activeCategory || course.category === activeCategory;

      const matchesQuery =
        !normalizedQuery ||
        (course.title || "").toLowerCase().includes(normalizedQuery) ||
        (course.instructorName || "").toLowerCase().includes(normalizedQuery) ||
        (course.category || "").toLowerCase().includes(normalizedQuery) ||
        (course.description || "").toLowerCase().includes(normalizedQuery);

      return matchesCategory && matchesQuery;
    });
  }, [courses, query, activeCategory]);

  const visibleCourses = filteredCourses.slice(0, visibleCount);
  const featuredCourse = courses[0] || null;
  const featuredEnrolled = featuredCourse
    ? isEnrolled(featuredCourse.id)
    : false;

  const handleSearch = (value) => {
    setQuery(value);

    if (value.trim()) {
      setSearchParams({ q: value });
    } else {
      setSearchParams({});
    }
  };

  const clearFilters = () => {
    setQuery("");
    setActiveCategory(null);
    setSearchParams({});
  };

  const retryFetch = () => {
    dispatch(fetchPublishedCourses());
  };

  const loading = status === "idle" || status === "loading";

  return (
    <div className="min-h-screen bg-surface text-heading">
      <Navbar />

      {/* Utility bar */}
      <div className="border-b border-line bg-surface-muted">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span className="flex items-center justify-center gap-2 text-body sm:justify-start">
            <User size={16} className="text-primary" />
            Learn new skills. Build your future.
          </span>

          {user?.role !== "admin" && user?.role !== "instructor" && (
            <Link
              to="/become-instructor"
              className="flex items-center justify-center gap-2 font-semibold text-heading transition-colors hover:text-primary"
            >
              <Presentation size={16} />
              Become an Instructor
              <ArrowRight size={14} />
            </Link>
          )}
        </div>
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line bg-gradient-to-br from-slate-50 via-white to-red-50">
        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 top-20 h-72 w-72 rounded-full bg-secondary/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:py-20">
          <div className="text-center lg:text-left">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary">
              <Sparkles size={14} />
              Explore. Learn. Grow.
            </div>

            <h1 className="max-w-3xl text-3xl font-bold leading-tight tracking-tight text-heading sm:text-4xl lg:text-5xl">
              Discover courses that help you{" "}
              <span className="text-primary">move forward.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-body sm:text-base lg:mx-0 lg:text-lg">
              Explore practical courses designed to help you develop valuable
              knowledge, strengthen your skills, and achieve your learning
              goals.
            </p>

            <div className="mx-auto mt-7 max-w-2xl lg:mx-0">
              <div className="group flex items-center rounded-2xl border border-line bg-white p-2 shadow-lg shadow-gray-200/50 focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
                <Search
                  size={21}
                  className="ml-3 shrink-0 text-body group-focus-within:text-primary"
                />

                <input
                  type="search"
                  value={query}
                  onChange={(event) => handleSearch(event.target.value)}
                  placeholder="What do you want to learn?"
                  className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm text-heading outline-none placeholder:text-gray-400 sm:text-base"
                />

                {query && (
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="mr-1 rounded-xl p-2 text-body hover:bg-surface-muted hover:text-heading"
                    aria-label="Clear search"
                  >
                    <X size={18} />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() =>
                    document
                      .getElementById("course-results")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="hidden rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90 sm:block"
                >
                  Search
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-body lg:justify-start">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Practical learning
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Flexible learning
                </span>

                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  Certificates
                </span>
              </div>
            </div>
          </div>

          {/* Featured course is real data from Redux */}
          <div className="relative mx-auto w-full max-w-lg">
            {featuredCourse ? (
              <Link
                to={
                  featuredEnrolled
                    ? courseLearnPath(featuredCourse.id)
                    : `/courses/${featuredCourse.id}`
                }
                className="group relative block overflow-hidden rounded-3xl border border-white bg-secondary p-2 shadow-2xl"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-secondary">
                  <CourseImage
                    src={featuredCourse.image}
                    title={featuredCourse.title}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                        Featured course
                      </span>

                      <CourseRating rating={featuredCourse.rating} />
                    </div>

                    <h2 className="text-lg font-bold sm:text-xl">
                      {featuredCourse.title}
                    </h2>

                    <p className="mt-1 text-sm text-white/80">
                      {featuredCourse.instructorName}
                    </p>

                    <p className="mt-3">
                      <CoursePrice
                        price={featuredCourse.price}
                        enrolled={featuredEnrolled}
                        className="text-lg font-extrabold"
                      />
                    </p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-3xl border border-line bg-white p-8 text-center shadow-lg">
                <div>
                  <BookOpen className="mx-auto text-primary" size={38} />
                  <p className="mt-4 font-semibold text-heading">
                    {loading
                      ? "Loading featured course..."
                      : "Explore our courses"}
                  </p>
                  <p className="mt-2 text-sm text-body">
                    Published courses will appear here.
                  </p>
                </div>
              </div>
            )}

            <div className="absolute -bottom-5 -left-3 hidden rounded-2xl border border-line bg-white p-4 shadow-xl sm:block sm:-left-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <PlayCircle size={21} />
                </div>

                <div>
                  <p className="text-xs text-body">Start learning</p>
                  <p className="text-sm font-bold text-heading">
                    At your own pace
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real catalogue stats */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-y divide-line px-4 sm:grid-cols-4 sm:divide-y-0 sm:px-6">
          <div className="flex items-center justify-center gap-3 px-3 py-5 sm:py-6">
            <BookOpen className="hidden text-primary sm:block" size={22} />
            <div>
              <p className="text-lg font-bold text-heading sm:text-xl">
                {loading ? "—" : courses.length}
              </p>
              <p className="text-xs text-body sm:text-sm">Published courses</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-3 py-5 sm:py-6">
            <GraduationCap
              className="hidden text-secondary sm:block"
              size={22}
            />
            <div>
              <p className="text-lg font-bold text-heading sm:text-xl">
                {categories.length}
              </p>
              <p className="text-xs text-body sm:text-sm">Course categories</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-3 py-5 sm:py-6">
            <Tag className="hidden text-primary sm:block" size={22} />
            <div>
              <p className="text-lg font-bold text-heading sm:text-xl">
                {loading ? "—" : filteredCourses.length}
              </p>
              <p className="text-xs text-body sm:text-sm">Matching courses</p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 px-3 py-5 sm:py-6">
            <Award className="hidden text-secondary sm:block" size={22} />
            <div>
              <p className="text-lg font-bold text-heading sm:text-xl">
                Learning
              </p>
              <p className="text-xs text-body sm:text-sm">Earn as you learn</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Explore by category
            </span>

            <h2 className="mt-2 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              Find a subject that fits your goals
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-body sm:text-base">
              Choose a category to explore published courses in that subject.
            </p>
          </div>

          {activeCategory && (
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className="flex w-fit items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-semibold text-heading hover:border-primary hover:text-primary"
            >
              <X size={15} />
              Clear category
            </button>
          )}
        </div>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((category) => {
              const isActive = activeCategory === category;

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(isActive ? null : category)}
                  aria-pressed={isActive}
                  className={`rounded-2xl border p-4 text-left transition-all sm:p-5 ${
                    isActive
                      ? "border-primary bg-primary text-white shadow-lg"
                      : "border-line bg-white text-heading hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${
                      isActive ? "bg-white/15" : "bg-primary/10 text-primary"
                    }`}
                  >
                    <BookOpen size={20} />
                  </div>

                  <p className="break-words text-sm font-bold leading-5">
                    {category}
                  </p>

                  <p
                    className={`mt-1 text-xs ${
                      isActive ? "text-white/75" : "text-body"
                    }`}
                  >
                    Explore courses
                  </p>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-line bg-white p-6 text-sm text-body">
            Course categories will appear here when published courses are
            available.
          </p>
        )}
      </section>

      {/* Featured promotion */}
      {featuredCourse && !query && !activeCategory && (
        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-secondary">
            <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-white/5 blur-3xl" />
            <div className="relative grid items-center gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_0.8fr] lg:p-10">
              <div className="text-white">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-blue-100">
                  <Sparkles size={14} />
                  Featured learning opportunity
                </div>

                <h2 className="max-w-2xl text-2xl font-bold leading-tight sm:text-3xl">
                  Build knowledge that can make a difference in your career.
                </h2>

                <p className="mt-4 max-w-xl text-sm leading-6 text-blue-100 sm:text-base">
                  Explore our published courses and find a learning opportunity
                  that supports your next step.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    to={
                      featuredEnrolled
                        ? courseLearnPath(featuredCourse.id)
                        : `/courses/${featuredCourse.id}`
                    }
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
                  >
                    {featuredEnrolled
                      ? "Continue learning"
                      : "View featured course"}
                    <ArrowRight size={16} />
                  </Link>

                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("course-results")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-bold text-white hover:bg-white/10"
                  >
                    Browse all courses
                    <BookOpen size={16} />
                  </button>
                </div>
              </div>

              <Link
                to={
                  featuredEnrolled
                    ? courseLearnPath(featuredCourse.id)
                    : `/courses/${featuredCourse.id}`
                }
                className="hidden overflow-hidden rounded-2xl border border-white/10 bg-white/10 p-2 backdrop-blur lg:block"
              >
                <CourseImage
                  src={featuredCourse.image}
                  title={featuredCourse.title}
                  className="aspect-video w-full rounded-xl object-cover"
                />

                <div className="p-4">
                  <p className="text-xs text-blue-200">
                    {featuredCourse.category}
                  </p>
                  <p className="mt-1 text-sm font-bold text-white">
                    {featuredCourse.title}
                  </p>
                  <p className="mt-2">
                    <CoursePrice
                      price={featuredCourse.price}
                      enrolled={featuredEnrolled}
                      className="text-sm font-semibold text-white"
                    />
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Course results */}
      <section
        id="course-results"
        className="scroll-mt-20 border-y border-line bg-surface-muted/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary">
                Course catalogue
              </span>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
                {activeCategory || "Explore"} Courses
              </h2>

              <p className="mt-2 text-sm text-body sm:text-base">
                {query
                  ? `Showing results for "${query}"`
                  : "Choose a course and start your next learning journey."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-body">
                Showing{" "}
                <strong className="text-heading">
                  {loading
                    ? "—"
                    : Math.min(visibleCount, filteredCourses.length)}
                </strong>{" "}
                of{" "}
                <strong className="text-heading">
                  {loading ? "—" : filteredCourses.length}
                </strong>
              </span>

              <div className="flex items-center rounded-xl border border-line bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setView("grid")}
                  aria-pressed={view === "grid"}
                  title="Grid view"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    view === "grid"
                      ? "bg-heading text-white"
                      : "text-body hover:bg-surface-muted hover:text-heading"
                  }`}
                >
                  <LayoutGrid size={17} />
                </button>

                <button
                  type="button"
                  onClick={() => setView("list")}
                  aria-pressed={view === "list"}
                  title="List view"
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    view === "list"
                      ? "bg-heading text-white"
                      : "text-body hover:bg-surface-muted hover:text-heading"
                  }`}
                >
                  <List size={17} />
                </button>
              </div>
            </div>
          </div>

          {(query || activeCategory) && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-body">
                <SlidersHorizontal size={15} />
                Active filters:
              </div>

              {query && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-heading">
                  Search: {query}
                  <button
                    type="button"
                    onClick={() => handleSearch("")}
                    className="text-body hover:text-primary"
                    aria-label="Remove search filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              {activeCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
                  {activeCategory}
                  <button
                    type="button"
                    onClick={() => setActiveCategory(null)}
                    className="hover:text-primary/70"
                    aria-label="Remove category filter"
                  >
                    <X size={13} />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={clearFilters}
                className="text-xs font-bold text-primary hover:underline"
              >
                Clear all
              </button>
            </div>
          )}

          {loading ? (
            <div className="rounded-3xl border border-line bg-white px-6 py-16 text-center shadow-sm">
              <RefreshCw
                size={28}
                className="mx-auto animate-spin text-primary"
              />
              <h3 className="mt-4 text-lg font-bold text-heading">
                Loading published courses
              </h3>
              <p className="mt-2 text-sm text-body">
                Getting the latest courses from SAGE.
              </p>
            </div>
          ) : status === "failed" ? (
            <div className="rounded-3xl border border-red-200 bg-white px-6 py-16 text-center shadow-sm">
              <BookOpen size={30} className="mx-auto text-primary" />
              <h3 className="mt-4 text-lg font-bold text-heading">
                We couldn't load the courses
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-body">
                {error || "Please check your connection and try again."}
              </p>
              <button
                type="button"
                onClick={retryFetch}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
              >
                <RefreshCw size={16} />
                Try again
              </button>
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search size={28} />
              </div>

              <h3 className="mt-5 text-lg font-bold text-heading sm:text-xl">
                {courses.length === 0
                  ? "No published courses yet"
                  : "We couldn't find that course"}
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-body">
                {courses.length === 0
                  ? "Published courses will appear here once they are available."
                  : "Try a different keyword, explore another category, or clear your filters."}
              </p>

              {(query || activeCategory) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
                >
                  Browse all courses
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          ) : view === "grid" ? (
            <div className="grid grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visibleCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  enrolled={isEnrolled(course.id)}
                  fullWidth
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {visibleCourses.map((course) => (
                <CourseListRow
                  key={course.id}
                  course={course}
                  enrolled={isEnrolled(course.id)}
                />
              ))}
            </div>
          )}

          {!loading && !error && visibleCount < filteredCourses.length && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold text-heading shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md"
              >
                Load more courses
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Why SAGE */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Why learn with SAGE?
            </span>

            <h2 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-heading sm:text-3xl lg:text-4xl">
              More than courses.
              <span className="block text-primary">
                A complete learning experience.
              </span>
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-body sm:text-base">
              Discover courses, build your knowledge, and work towards your
              learning goals with SAGE.
            </p>

            <Link
              to="/create-account"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Start learning
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {LEARNING_BENEFITS.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="rounded-2xl border border-line bg-white p-5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={21} />
                  </div>

                  <h3 className="mt-4 text-base font-bold text-heading">
                    {benefit.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-body">
                    {benefit.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Learning journey */}
      <section className="bg-surface-muted">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Your learning journey
            </span>

            <h2 className="mt-3 text-2xl font-bold tracking-tight text-heading sm:text-3xl">
              Learn at your own pace
            </h2>

            <p className="mt-3 text-sm leading-6 text-body sm:text-base">
              Discover a course, develop your knowledge, and move forward with
              confidence.
            </p>
          </div>

          <div className="relative mt-10 grid gap-8 sm:grid-cols-3">
            {[
              {
                number: "01",
                icon: Search,
                title: "Discover",
                text: "Explore published courses and find subjects that match your goals.",
              },
              {
                number: "02",
                icon: PlayCircle,
                title: "Learn",
                text: "Work through structured lessons and develop useful knowledge.",
              },
              {
                number: "03",
                icon: Award,
                title: "Achieve",
                text: "Complete your course and celebrate your learning achievement.",
              },
            ].map((step) => {
              const Icon = step.icon;

              return (
                <div key={step.number} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-surface-muted bg-primary text-white shadow-lg">
                    <Icon size={19} />
                  </div>

                  <span className="mt-4 block text-xs font-bold tracking-widest text-primary">
                    STEP {step.number}
                  </span>

                  <h3 className="mt-2 text-lg font-bold text-heading">
                    {step.title}
                  </h3>

                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-body">
                    {step.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-14 sm:px-6 lg:py-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-[#8f0000] px-6 py-12 text-center text-white shadow-xl sm:px-10 lg:px-16 lg:py-16">
          <div className="relative mx-auto max-w-3xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <GraduationCap size={25} />
            </div>

            <h2 className="mt-5 text-2xl font-bold leading-tight sm:text-3xl lg:text-4xl">
              Ready to start your next learning journey?
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-sm leading-6 text-white/80 sm:text-base">
              Explore our published course catalogue and find a learning
              opportunity that fits your goals.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/create-account"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary hover:bg-white/90"
              >
                Create your account
                <ArrowRight size={17} />
              </Link>

              <button
                type="button"
                onClick={() =>
                  document
                    .getElementById("course-results")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-bold text-white hover:bg-white/15"
              >
                Explore courses
                <BookOpen size={17} />
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 max-w-7xl">
          <BecomeInstructorCTA />
        </div>
      </section>

      <Footer />
    </div>
  );
}
