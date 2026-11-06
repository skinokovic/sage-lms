import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  PlayCircle,
  Sparkles,
  Star,
  Users,
} from "lucide-react";

import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import Navbar from "../components/Navbar";

import { PrimaryButton, SecondaryButton } from "../components/Buttons";

import FeatureCard from "../components/FeatureCard";

import CourseSlider from "../components/CourseSlider";

import Footer from "../components/Footer";

import { fetchPublishedCourses } from "../store/courseSlice";
import { enrollmentApi } from "../api/enrollmentApi";
import { courseLearnPath } from "../hooks/userEnrollment";

/* ============================================================
   COURSE ROWS
   Popular, Featured and Trending are built from the real
   published courses. Nothing here is sample data.
============================================================ */

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_COURSE_DAYS = 30;
const ROW_SIZE = 8;

const byNewest = (a, b) =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

const isNewCourse = (course) =>
  course.createdAt &&
  Date.now() - new Date(course.createdAt).getTime() < NEW_COURSE_DAYS * DAY_MS;

// The shape CourseSlider's cards expect
const toSliderCourse = (course, extras = {}) => ({
  id: course.id,
  title: course.title,
  instructor: course.instructorName || "SAGE Instructor",
  image: course.image,
  rating: Number(course.rating || 0),
  reviews: Number(course.reviewCount || 0),
  price: Number(course.price || 0),
  originalPrice: Number(course.originalPrice || course.price || 0),
  category: course.category || "",
  ...extras,
});

/* ============================================================
   FEATURES
============================================================ */

const FEATURES = [
  {
    icon: <BookOpen size={24} className="text-primary" />,
    bgClassName: "bg-red-50",
    title: "Quality Courses",
    description:
      "Well-structured courses designed by experienced professionals.",
  },
  {
    icon: <Users size={24} className="text-secondary" />,
    bgClassName: "bg-blue-50",
    title: "Expert Instructors",
    description:
      "Learn from professionals with practical real-world experience.",
  },
  {
    icon: <BadgeCheck size={24} className="text-emerald-600" />,
    bgClassName: "bg-emerald-50",
    title: "Recognized Certificates",
    description:
      "Earn certificates that help validate your knowledge and skills.",
  },
];

/* ============================================================
   WHY SAGE
============================================================ */

const WHY_SAGE = [
  "Learn at your own pace",
  "Practical and career-focused content",
  "Expert-led learning experiences",
  "Track your progress from your dashboard",
  "Earn certificates after completing courses",
  "Access your learning from any device",
];

/* ============================================================
   STUDENT LEARNING PROGRESS (real data)
============================================================ */

function StudentProgressCard() {
  const [state, setState] = useState({ loading: true, enrollments: [] });

  useEffect(() => {
    let cancelled = false;

    enrollmentApi
      .mine()
      .then(({ data }) => {
        if (!cancelled) {
          setState({ loading: false, enrollments: data.enrollments || [] });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ loading: false, enrollments: [] });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, enrollments } = state;

  const completedCourses = enrollments.filter(
    (enrollment) =>
      enrollment.status === "completed" || enrollment.progress >= 100,
  ).length;

  const lessonsDone = enrollments.reduce(
    (sum, enrollment) => sum + (enrollment.completedLessons || 0),
    0,
  );

  // Pick up where the student left off: a course already started, else the
  // newest one that isn't finished.
  const unfinished = enrollments.filter(
    (enrollment) => (enrollment.progress || 0) < 100,
  );
  const current =
    unfinished.find((enrollment) => enrollment.completedLessons > 0) ||
    unfinished[0] ||
    null;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-7">
      <div className="rounded-2xl bg-white p-5 sm:p-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-5">
          <div>
            <p className="text-xs font-medium text-gray-400">YOUR LEARNING</p>

            <p className="mt-1 text-lg font-bold text-gray-900">
              Learning Progress
            </p>
          </div>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-primary">
            <BookOpen size={19} />
          </div>
        </div>

        {loading ? (
          <div className="mt-6 animate-pulse space-y-4">
            <div className="h-4 w-2/3 rounded bg-gray-100" />
            <div className="h-2 rounded-full bg-gray-100" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-20 rounded-xl bg-gray-100" />
              <div className="h-20 rounded-xl bg-gray-100" />
            </div>
          </div>
        ) : enrollments.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-gray-900">
              You haven't enrolled in a course yet
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Find a course and your progress will show up here.
            </p>
            <Link
              to="/courses"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Explore Courses
              <ArrowRight size={17} />
            </Link>
          </div>
        ) : (
          <>
            {current && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">
                      {current.course?.title}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      {current.completedLessons} of {current.totalLessons}{" "}
                      lessons completed
                    </p>
                  </div>

                  <span className="text-sm font-bold text-primary">
                    {current.progress}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${current.progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xl font-bold text-gray-900">{lessonsDone}</p>

                <p className="mt-1 text-xs text-gray-500">Lessons completed</p>
              </div>

              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xl font-bold text-gray-900">
                  {completedCourses}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {completedCourses === 1
                    ? "Course completed"
                    : "Courses completed"}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center gap-3">
                <BadgeCheck size={20} className="shrink-0 text-emerald-600" />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {current
                      ? "Pick up where you left off"
                      : "You've completed all your courses"}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {current
                      ? "Keep going and complete your next lesson."
                      : "Explore more courses to keep learning."}
                  </p>
                </div>

                {current && (
                  <Link
                    to={courseLearnPath(current.course?.id)}
                    className="shrink-0 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Continue
                  </Link>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   HOMEPAGE
============================================================ */

export default function Homepage() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isStudent = user?.role === "student";

  const { publishedItems: courses = [], publishedStatus: status = "idle" } =
    useSelector((state) => state.courses);

  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchPublishedCourses());
    }
  }, [dispatch, status]);

  const loadingCourses = status === "idle" || status === "loading";

  const { popular, featured, trending } = useMemo(() => {
    // Admin-chosen courses
    const featuredRow = courses
      .filter((course) => course.featured)
      .sort(byNewest)
      .slice(0, ROW_SIZE)
      .map((course) =>
        toSliderCourse(course, {
          badge: { label: "Featured", tone: "premium" },
        }),
      );

    // Most enrolled of all time. Until anyone has enrolled, newest first.
    const enrolledCourses = courses.filter(
      (course) => Number(course.enrollmentCount || 0) > 0,
    );

    const popularSource = enrolledCourses.length
      ? [...enrolledCourses].sort(
          (a, b) =>
            Number(b.enrollmentCount) - Number(a.enrollmentCount) ||
            byNewest(a, b),
        )
      : [...courses].sort(byNewest);

    const popularRow = popularSource
      .slice(0, ROW_SIZE)
      .map((course, index) =>
        toSliderCourse(
          course,
          index === 0 && Number(course.enrollmentCount || 0) > 0
            ? { bestseller: true }
            : {},
        ),
      );

    // Most new enrollments over the last 30 days
    const trendingRow = courses
      .filter((course) => Number(course.recentEnrollmentCount || 0) > 0)
      .sort(
        (a, b) =>
          Number(b.recentEnrollmentCount) - Number(a.recentEnrollmentCount) ||
          byNewest(a, b),
      )
      .slice(0, ROW_SIZE)
      .map((course) =>
        toSliderCourse(
          course,
          isNewCourse(course)
            ? { badge: { label: "Hot & New", tone: "hot" } }
            : {},
        ),
      );

    return {
      popular: popularRow,
      featured: featuredRow,
      trending: trendingRow,
    };
  }, [courses]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ======================================================
          HERO SECTION
      ====================================================== */}
      <section className="relative overflow-hidden bg-[#F8FAFC]">
        {/* Background decoration */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-100/60 blur-3xl" />

          <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-red-100/50 blur-3xl" />

          <div className="absolute left-1/2 top-1/3 h-64 w-64 -translate-x-1/2 rounded-full bg-blue-50/70 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-8 lg:py-24">
          {/* ==================================================
              HERO CONTENT
          ================================================== */}
          <div className="text-center lg:text-left">
            {/* Small badge */}
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-3.5 py-2 text-xs font-semibold text-primary shadow-sm">
              <Sparkles size={14} />
              Learn. Grow. Lead.
            </div>

            {/* Heading */}
            <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-[1.08] tracking-tight text-gray-950 sm:text-5xl lg:mx-0 lg:text-6xl">
              Build Skills That{" "}
              <span className="relative inline-block text-primary">
                Move Your Career
              </span>{" "}
              Forward.
            </h1>

            {/* Accent line */}
            <div className="mx-auto mt-6 h-1.5 w-20 rounded-full bg-secondary lg:mx-0" />

            {/* Description */}
            <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-gray-600 sm:text-lg lg:mx-0">
              Learn practical, career-focused skills from experienced
              professionals. Build your knowledge, advance your career, and
              learn at your own pace with SAGE.
            </p>

            {/* CTA buttons */}
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
              <Link to="/create-account" className="w-full sm:w-auto">
                <PrimaryButton className="flex w-full cursor-pointer items-center justify-center gap-2 px-6 py-3 text-sm font-semibold shadow-lg shadow-red-900/10 transition duration-200 hover:-translate-y-0.5 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base">
                  Get Started
                  <ArrowRight size={17} />
                </PrimaryButton>
              </Link>

              <Link to="/courses" className="w-full sm:w-auto">
                <SecondaryButton className="flex w-full cursor-pointer items-center justify-center gap-2 border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto sm:px-7 sm:py-3.5 sm:text-base">
                  <PlayCircle size={17} />
                  Explore Courses
                </SecondaryButton>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-gray-500 lg:justify-start">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Expert-led learning
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Flexible learning
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-emerald-600" />
                Career focused
              </div>
            </div>
          </div>

          {/* ==================================================
              HERO VISUAL
          ================================================== */}
          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            {/* Decorative card behind image */}
            <div className="absolute -right-4 -top-4 h-full w-full rounded-[2rem] bg-secondary/10 sm:-right-6 sm:-top-6" />

            {/* Main image */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-[1.75rem] border border-white bg-gray-100 shadow-2xl shadow-gray-900/10">
              <img
                src="/assets/hero_image.jpg"
                alt="Student learning online with a laptop"
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />

              {/* Image overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/50 via-transparent to-transparent" />

              {/* Bottom image content */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                <div className="rounded-2xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md sm:p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-primary">
                      <GraduationCap size={23} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900">
                        Learn from anywhere
                      </p>

                      <p className="mt-0.5 text-xs text-gray-500">
                        Flexible learning designed around you
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating rating card */}
            <div className="absolute -left-3 top-5 rounded-2xl border border-white bg-white p-3 shadow-xl shadow-gray-900/10 sm:-left-6 sm:top-10 sm:p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                  <Star size={17} className="fill-amber-400 text-amber-400" />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">4.8/5</p>

                  <p className="text-[10px] text-gray-500">Learner rating</p>
                </div>
              </div>
            </div>

            {/* Floating students card */}
            <div className="absolute -bottom-5 -right-2 rounded-2xl border border-white bg-white px-4 py-3 shadow-xl shadow-gray-900/10 sm:-right-5 sm:px-5 sm:py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-secondary">
                  <Users size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-900">10,000+</p>

                  <p className="text-[10px] text-gray-500">
                    Learning community
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          TRUST / STATISTICS BAR
      ====================================================== */}
      <section className="border-y border-gray-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-gray-100 px-5 sm:grid-cols-4 sm:px-6 lg:px-8">
          <div className="px-3 py-6 text-center sm:py-7">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              10K+
            </p>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Learners</p>
          </div>

          <div className="px-3 py-6 text-center sm:py-7">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              100+
            </p>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">Courses</p>
          </div>

          <div className="border-t border-gray-100 px-3 py-6 text-center sm:border-t-0 sm:py-7">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              50+
            </p>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Expert Instructors
            </p>
          </div>

          <div className="border-t border-gray-100 px-3 py-6 text-center sm:border-t-0 sm:py-7">
            <p className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              95%
            </p>

            <p className="mt-1 text-xs text-gray-500 sm:text-sm">
              Learner Satisfaction
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================
          FEATURES
      ====================================================== */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
            Why choose SAGE
          </p>

          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Learning designed to help you move forward
          </h2>

          <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
            Everything you need to build relevant skills, stay motivated, and
            make meaningful progress.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </section>

      {/* ======================================================
          WHY SAGE SECTION
      ====================================================== */}
      <section className="overflow-hidden bg-gray-950">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8 lg:py-20">
          {/* Content */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">
              The SAGE experience
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Learn skills that make a difference.
            </h2>

            <p className="mt-5 max-w-xl text-sm leading-7 text-gray-300 sm:text-base">
              SAGE brings structured learning, practical knowledge, and expert
              guidance together in one place — helping you take control of your
              professional development.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {WHY_SAGE.map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-0.5 shrink-0 text-red-300">
                    <CheckCircle2 size={17} />
                  </div>

                  <span className="text-sm text-gray-200">{item}</span>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <Link to="/create-account" className="inline-flex">
                <PrimaryButton className="flex items-center cursor-pointer gap-2 px-6 py-3 text-sm font-semibold shadow-lg shadow-red-900/20">
                  Start Learning
                  <ArrowRight size={17} />
                </PrimaryButton>
              </Link>
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            {isStudent ? (
              // ==========================================
              // STUDENT: LEARNING PROGRESS (real data)
              // ==========================================
              <StudentProgressCard />
            ) : (
              // ==========================================
              // NON-STUDENT: DISCOVER SAGE
              // ==========================================
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:p-7">
                <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8">
                  {/* Decorative background */}
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-red-100 blur-2xl" />

                  <div className="relative">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-primary">
                      <BookOpen size={22} />
                    </div>

                    <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-primary">
                      SAGE Learning
                    </p>

                    <h3 className="mt-2 text-2xl font-extrabold leading-tight text-gray-900 sm:text-3xl">
                      Build skills that move your career forward.
                    </h3>

                    <p className="mt-4 text-sm leading-6 text-gray-500">
                      Explore practical courses designed to help you learn
                      valuable skills, strengthen your expertise and achieve
                      your professional goals.
                    </p>

                    <div className="mt-6 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50">
                          <BadgeCheck size={17} className="text-emerald-600" />
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                          Practical, career-focused learning
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50">
                          <BookOpen size={17} className="text-secondary" />
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                          Learn at your own pace
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-50">
                          <Award size={17} className="text-primary" />
                        </div>

                        <p className="text-sm font-medium text-gray-700">
                          Earn certificates as you progress
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/courses"
                      className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
                    >
                      Explore Courses
                      <ArrowRight size={17} />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Decorative element */}
            <div className="absolute -bottom-8 -right-8 -z-0 h-32 w-32 rounded-full bg-primary/20 blur-2xl" />
          </div>
        </div>
      </section>

      {/* ======================================================
          COURSE ROWS (real published courses)
      ====================================================== */}
      {loadingCourses && (
        <section className="bg-white py-14">
          <div className="mx-auto max-w-7xl animate-pulse px-5 sm:px-6 lg:px-8">
            <div className="h-7 w-56 rounded bg-gray-100" />
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="space-y-3">
                  <div className="aspect-[16/10] rounded-2xl bg-gray-100" />
                  <div className="h-4 w-3/4 rounded bg-gray-100" />
                  <div className="h-4 w-1/2 rounded bg-gray-100" />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* POPULAR: most enrolled (newest first until anyone has enrolled) */}
      {!loadingCourses && popular.length > 0 && (
        <section className="bg-white pt-12 sm:pt-16">
          <CourseSlider title="Popular Courses" courses={popular} />
        </section>
      )}

      {/* FEATURED: courses an admin has chosen to feature */}
      {!loadingCourses && featured.length > 0 && (
        <section className="bg-gray-50 pt-2">
          <CourseSlider title="Featured Courses" courses={featured} />
        </section>
      )}

      {/* TRENDING: most new enrollments over the last 30 days */}
      {!loadingCourses && trending.length > 0 && (
        <section className="bg-white pt-2">
          <CourseSlider title="Trending Courses" courses={trending} />
        </section>
      )}

      {/* ======================================================
          FINAL CTA
      ====================================================== */}
      <section className="px-5 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#980000] to-[#720000] px-6 py-12 text-center shadow-xl shadow-red-900/15 sm:px-10 lg:px-16 lg:py-16">
          {/* Decorations */}
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

          <div className="relative">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
              <GraduationCap size={25} />
            </div>

            <h2 className="mx-auto mt-5 max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ready to start your next learning journey?
            </h2>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-red-100 sm:text-base">
              Create your free account, explore our courses, and start building
              skills that can take your career further.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/create-account" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50 sm:w-auto"
                >
                  Create Free Account
                  <ArrowRight size={17} />
                </button>
              </Link>

              <Link to="/courses" className="w-full sm:w-auto">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15 sm:w-auto"
                >
                  Browse Courses
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTER
      ====================================================== */}
      <Footer />
    </div>
  );
}
