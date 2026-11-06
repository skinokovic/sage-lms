import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Plus,
  Users,
  Video,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import axiosClient from "../../api/axiosClient";
import StatCard from "../../components/dashboard/StatCard";
import CourseCard from "../../components/dashboard/CourseCard";
import ActivityList from "../../components/dashboard/ActivityList";
import { getFirstName } from "../../utils/user";

const getGreeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const timeAgo = (iso) => {
  const seconds = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 1000),
  );

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;

  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
};

const formatClassTime = (startsAt) => {
  const tz = "Africa/Lagos";
  const start = new Date(startsAt);
  const dayKey = (date) => date.toLocaleDateString("en-CA", { timeZone: tz });

  const time = start.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: tz,
  });

  if (dayKey(start) === dayKey(new Date())) return `Today, ${time}`;
  if (dayKey(start) === dayKey(new Date(Date.now() + 86400000)))
    return `Tomorrow, ${time}`;

  return `${start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  })}, ${time}`;
};

const PerformanceBar = ({ label, value, color }) => (
  <div>
    <div className="mb-2 flex justify-between text-xs">
      <span className="text-gray-500">{label}</span>

      <span className="font-semibold text-gray-700">
        {value === null || value === undefined ? "—" : `${value}%`}
      </span>
    </div>

    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
      <div
        className={`h-full rounded-full ${color}`}
        style={{ width: `${value ?? 0}%` }}
      />
    </div>
  </div>
);

const InstructorDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const firstName = getFirstName(user);
  const greeting = getGreeting();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/instructor/dashboard");
      setData(response.data);
    } catch (err) {
      setError(
        err.response?.data?.message || "Couldn't load your dashboard data.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const stats = data?.stats;
  const courses = data?.courses ?? [];
  const nextClass = data?.nextClass;
  const performance = data?.performance;

  const activities = (data?.activities ?? []).map((activity) => ({
    type: activity.type,
    title: activity.title,
    description: activity.description,
    time: timeAgo(activity.at),
  }));

  const show = (value) => (loading || !stats ? "—" : String(value));

  const manageCourse = (id) =>
    navigate(`/dashboard/instructor/courses/${id}/builder`);
  const openCourse = (id) =>
    navigate(`/dashboard/instructor/courses/${id}/learn`);

  const otherCourses = courses.slice(2);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* =====================================================
          ERROR
      ====================================================== */}
      {error && (
        <div className="flex flex-col gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-[#B00000] sm:flex-row sm:items-center sm:justify-between">
          <span className="flex items-center gap-2">
            <AlertCircle size={18} className="shrink-0" />
            {error}
          </span>

          <button
            type="button"
            onClick={loadDashboard}
            className="w-fit cursor-pointer rounded-xl bg-[#B00000] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      )}

      {/* =====================================================
          WELCOME
      ====================================================== */}
      <section className="rounded-2xl bg-[#1E3A8A] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-200">
              Instructor workspace
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              {greeting}, {firstName || "Instructor"}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Manage your courses, monitor student progress and review
              assignments.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/instructor/courses/create")}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            <Plus size={18} />
            Create Course
          </button>
        </div>
      </section>

      {/* =====================================================
          STATS
      ====================================================== */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="My Courses"
          value={show(stats?.courses)}
          description={`${stats?.publishedCourses ?? 0} published ${
            stats?.publishedCourses === 1 ? "course" : "courses"
          }`}
          icon={BookOpen}
        />

        <StatCard
          title="Total Students"
          value={show(stats?.students)}
          description="Across all courses"
          trend={stats?.studentsTrend || undefined}
          icon={Users}
        />

        <StatCard
          title="Assignments"
          value={show(stats?.assignments)}
          description="Active assignments"
          icon={FileText}
        />

        <StatCard
          title="Pending Reviews"
          value={show(stats?.pendingReviews)}
          description="Submissions awaiting review"
          icon={ClipboardCheck}
        />
      </section>

      {/* =====================================================
          COURSES + RECENT ACTIVITY
      ====================================================== */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* MY COURSES */}
        <div className="xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">My Courses</h3>

              <p className="mt-1 text-xs text-gray-500">
                Manage your recently updated courses
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/dashboard/instructor/courses")}
              className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#B00000]"
            >
              View all
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white"
                />
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              {courses.slice(0, 2).map((course) => (
                <div
                  key={course.id}
                  onClick={() => manageCourse(course.id)}
                  className="h-full cursor-pointer"
                >
                  <CourseCard
                    title={course.title}
                    category={course.category}
                    students={course.students}
                    lessons={course.lessons}
                    duration={course.duration}
                    status={course.status}
                    actionLabel="Manage course"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                <BookOpen size={26} />
              </div>

              <h4 className="mt-4 font-bold text-gray-900">
                You haven't created any courses yet
              </h4>

              <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
                Create your first course to start teaching.
              </p>

              <button
                type="button"
                onClick={() => navigate("/dashboard/instructor/courses/create")}
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                <Plus size={16} />
                Create Course
              </button>
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Your latest teaching activity
              </p>
            </div>

            <CheckCircle2 size={20} className="text-[#1E3A8A]" />
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 animate-pulse rounded-xl bg-gray-100"
                  />
                ))}
              </div>
            ) : activities.length > 0 ? (
              <ActivityList activities={activities} />
            ) : (
              <div className="rounded-xl bg-gray-50 px-4 py-10 text-center">
                <CheckCircle2 size={26} className="mx-auto text-gray-300" />

                <p className="mt-2 text-sm font-semibold text-gray-700">
                  No activity yet
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  New enrollments, submissions and completions will show here.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =====================================================
          COURSE OVERVIEW
      ====================================================== */}
      {!loading && otherCourses.length > 0 && (
        <section>
          <div className="mb-4">
            <h3 className="text-lg font-bold text-gray-900">Course Overview</h3>

            <p className="mt-1 text-xs text-gray-500">
              Quick overview of your other courses
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {otherCourses.map((course) => (
              <div
                key={course.id}
                onClick={() => openCourse(course.id)}
                className="h-full cursor-pointer"
              >
                <CourseCard
                  title={course.title}
                  category={course.category}
                  students={course.students}
                  lessons={course.lessons}
                  duration={course.duration}
                  status={course.status}
                  actionLabel="Open course"
                />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* =====================================================
          SCHEDULE + TEACHING PERFORMANCE
      ====================================================== */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* UPCOMING CLASS */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <CalendarDays size={20} />
            </div>

            <div>
              <h3 className="font-bold text-gray-900">Upcoming Class</h3>

              <p className="text-xs text-gray-500">
                {nextClass
                  ? nextClass.live
                    ? "Happening now"
                    : formatClassTime(nextClass.startsAt)
                  : "Nothing scheduled"}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="mt-5 h-40 animate-pulse rounded-xl bg-gray-100" />
          ) : nextClass ? (
            <div className="mt-5 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#B00000]">
                {nextClass.live ? "Live now" : nextClass.type}
              </p>

              <h4 className="mt-1 font-bold text-gray-900">
                {nextClass.title}
              </h4>

              <p className="mt-1 text-xs text-gray-500">{nextClass.course}</p>

              {nextClass.mode === "Online" && nextClass.meetingLink ? (
                <a
                  href={nextClass.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#162f70]"
                >
                  <Video size={14} />
                  Open class
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => navigate("/dashboard/instructor/schedule")}
                  className="mt-4 cursor-pointer rounded-lg bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#162f70]"
                >
                  View schedule
                </button>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-gray-50 px-4 py-10 text-center">
              <CalendarDays size={26} className="mx-auto text-gray-300" />

              <p className="mt-2 text-sm font-semibold text-gray-700">
                No upcoming classes
              </p>

              <button
                type="button"
                onClick={() =>
                  navigate("/dashboard/instructor/schedules/create")
                }
                className="mt-3 cursor-pointer text-xs font-semibold text-[#B00000]"
              >
                Schedule a session
              </button>
            </div>
          )}
        </div>

        {/* TEACHING PERFORMANCE */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-bold text-gray-900">Teaching Performance</h3>

          <p className="mt-1 text-xs text-gray-500">
            Student engagement across your courses
          </p>

          <div className="mt-6 space-y-5">
            <PerformanceBar
              label="Course completion"
              value={loading ? null : performance?.completion}
              color="bg-[#B00000]"
            />

            <PerformanceBar
              label="Assignment submissions"
              value={loading ? null : performance?.submissionRate}
              color="bg-[#1E3A8A]"
            />

            <PerformanceBar
              label="Student engagement"
              value={loading ? null : performance?.engagement}
              color="bg-[#B00000]"
            />
          </div>

          <p className="mt-5 text-[11px] leading-4 text-gray-400">
            Engagement is the share of your students who completed a lesson in
            the last 30 days.
          </p>
        </div>
      </section>
    </div>
  );
};

export default InstructorDashboard;
