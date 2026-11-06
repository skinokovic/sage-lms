import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  PlayCircle,
  Target,
  Video,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

import axiosClient from "../../api/axiosClient";
import StatCard from "../../components/dashboard/StatCard";
import CourseCard from "../../components/dashboard/CourseCard";
import ProgressBar from "../../components/dashboard/ProgressBar";
import UserAvatar from "../../components/UserAvatar";
import { getFirstName } from "../../utils/user";

const formatMinutes = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest}m`;
  if (rest === 0) return `${hours}h`;
  return `${hours}h ${rest}m`;
};

const formatDue = (iso) => {
  if (!iso) return "No due date";

  const due = new Date(iso);
  const now = new Date();
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const days = Math.round((startOfDay(due) - startOfDay(now)) / 86400000);

  if (days < 0) return "Overdue";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return due.toLocaleDateString("en-US", { weekday: "long" });

  return due.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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

  if (dayKey(start) === dayKey(new Date())) return `Today at ${time}`;
  if (dayKey(start) === dayKey(new Date(Date.now() + 86400000)))
    return `Tomorrow at ${time}`;

  return `${start.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: tz,
  })} at ${time}`;
};

const formatClassEnd = (endsAt) =>
  new Date(endsAt).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });

const goalMessage = (percent) => {
  if (percent >= 100) return "Great job! You've reached your monthly target.";
  if (percent >= 50)
    return "You're making good progress toward your monthly learning target.";
  return "Complete a few more lessons to reach your monthly learning target.";
};

const StudentDashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const firstName = getFirstName(user);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axiosClient.get("/student/dashboard");
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
  const continueCourse = data?.continueCourse;
  const goal = data?.goal;
  const courses = data?.courses ?? [];
  const assignments = data?.assignments ?? [];
  const nextClass = data?.nextClass;

  const show = (value) => (loading || !stats ? "—" : String(value));

  const openCourse = (courseId) =>
    navigate(`/dashboard/student/courses/${courseId}/learn`);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Error */}
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

      {/* Welcome */}
      <section className="rounded-2xl bg-[#1E3A8A] p-5 text-white shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-200">
              Your learning space
            </p>

            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
              Welcome back{firstName ? `, ${firstName}` : ""}
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Keep learning, complete your assignments and continue working
              toward your learning goals.
            </p>
          </div>

          <Link
            to="/courses"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Browse Courses
            <ArrowRight size={17} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Enrolled Courses"
          value={show(stats?.enrolled)}
          description="Currently enrolled"
          icon={BookOpen}
        />

        <StatCard
          title="Completed"
          value={show(stats?.completed)}
          description="Courses completed"
          icon={CheckCircle2}
        />

        <StatCard
          title="Assignments"
          value={show(stats?.assignmentsDue)}
          description={
            stats?.assignmentsOverdue > 0
              ? `${stats.assignmentsOverdue} overdue`
              : "Due this week"
          }
          icon={FileText}
        />

        <StatCard
          title="Certificates"
          value={show(stats?.certificates)}
          description="Certificates earned"
          icon={Award}
        />
      </section>

      {/* Continue learning */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm xl:col-span-2">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-44 bg-blue-100" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-1/3 rounded bg-gray-100" />
                <div className="h-2 w-full rounded-full bg-gray-100" />
              </div>
            </div>
          ) : (
            <>
              <div className="relative bg-gradient-to-r from-[#1E3A8A] to-blue-700 p-6 text-white">
                <div className="relative z-10 max-w-xl">
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-200">
                    Continue learning
                  </p>

                  {continueCourse ? (
                    <>
                      <h3 className="mt-2 text-2xl font-bold">
                        {continueCourse.title}
                      </h3>

                      <p className="mt-2 text-sm text-blue-100">
                        {continueCourse.progress > 0
                          ? "Continue where you stopped and complete the next lesson."
                          : "Start your first lesson and begin learning."}
                      </p>

                      <button
                        type="button"
                        onClick={() => openCourse(continueCourse.id)}
                        className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                      >
                        <PlayCircle size={18} />
                        {continueCourse.progress > 0
                          ? "Continue Course"
                          : "Start Course"}
                      </button>
                    </>
                  ) : (
                    <>
                      <h3 className="mt-2 text-2xl font-bold">
                        {stats?.enrolled > 0
                          ? "You're all caught up"
                          : "Start your learning journey"}
                      </h3>

                      <p className="mt-2 text-sm text-blue-100">
                        {stats?.enrolled > 0
                          ? "You've completed every course you're enrolled in. Find your next one."
                          : "Enroll in a course to see your progress here."}
                      </p>

                      <Link
                        to="/courses"
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
                      >
                        <BookOpen size={18} />
                        Browse Courses
                      </Link>
                    </>
                  )}
                </div>

                <BookOpen
                  size={130}
                  strokeWidth={0.7}
                  className="absolute -bottom-8 right-5 hidden text-white/10 sm:block"
                />
              </div>

              <div className="p-5">
                <ProgressBar
                  value={continueCourse?.progress ?? 0}
                  label="Course progress"
                />

                {continueCourse && (
                  <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                      <BookOpen size={15} />
                      Lesson {continueCourse.nextLesson} of{" "}
                      {continueCourse.totalLessons}
                    </span>

                    <span className="flex items-center gap-1.5">
                      <Clock3 size={15} />
                      {continueCourse.remainingMinutes > 0
                        ? `${formatMinutes(continueCourse.remainingMinutes)} remaining`
                        : `${continueCourse.remainingLessons} ${
                            continueCourse.remainingLessons === 1
                              ? "lesson"
                              : "lessons"
                          } remaining`}
                    </span>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Goal */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
              <Target size={22} />
            </div>

            <div>
              <h3 className="font-bold text-gray-900">Learning Goal</h3>

              <p className="text-xs text-gray-500">Monthly progress</p>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div
              className="relative flex h-36 w-36 items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(#B00000 ${
                  (goal?.percent ?? 0) * 3.6
                }deg, #F3F4F6 0deg)`,
              }}
            >
              <div className="absolute inset-[12px] rounded-full bg-white" />

              <div className="relative text-center">
                <p className="text-3xl font-bold text-gray-900">
                  {loading ? "—" : `${goal?.percent ?? 0}%`}
                </p>

                <p className="text-xs text-gray-500">completed</p>
              </div>
            </div>
          </div>

          <p className="mt-5 text-center text-xs font-semibold text-gray-700">
            {loading
              ? " "
              : `${goal?.lessonsThisMonth ?? 0} of ${goal?.target ?? 12} lessons this month`}
          </p>

          <p className="mt-1 text-center text-xs leading-5 text-gray-500">
            {loading ? " " : goalMessage(goal?.percent ?? 0)}
          </p>
        </div>
      </section>

      {/* My courses */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">My Courses</h3>

            <p className="mt-1 text-xs text-gray-500">
              Continue learning from your enrolled courses
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/student/courses")}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-[#B00000]"
          >
            View all
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-56 animate-pulse rounded-2xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : courses.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => openCourse(course.id)}
                className="h-full cursor-pointer"
              >
                <CourseCard
                  title={course.title}
                  category={course.category}
                  instructor={course.instructor}
                  lessons={course.lessons}
                  duration={course.duration}
                  progress={course.progress}
                  status={course.status}
                  actionLabel={
                    course.progress >= 100
                      ? "View course"
                      : course.progress > 0
                        ? "Continue learning"
                        : "Start course"
                  }
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
              You haven't enrolled in any courses yet
            </h4>

            <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">
              Explore the course library and enroll to start learning.
            </p>

            <Link
              to="/dashboard/student/library"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Explore Courses
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </section>

      {/* Assignments + Live class */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Upcoming Assignments
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Keep track of your pending work
              </p>
            </div>

            <FileText size={20} className="text-[#1E3A8A]" />
          </div>

          <div className="mt-5 space-y-3">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="h-16 animate-pulse rounded-xl bg-gray-100"
                />
              ))
            ) : assignments.length > 0 ? (
              assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  onClick={() =>
                    navigate(`/dashboard/student/assignments/${assignment.id}`)
                  }
                  className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-100 p-3 transition hover:bg-gray-50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-[#B00000]">
                    <FileText size={18} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-sm font-semibold text-gray-800">
                      {assignment.title}
                    </h4>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {assignment.course}
                    </p>
                  </div>

                  <span className="shrink-0 text-xs font-semibold text-[#B00000]">
                    {formatDue(assignment.dueDate)}
                  </span>
                </div>
              ))
            ) : (
              <div className="rounded-xl bg-gray-50 px-4 py-8 text-center">
                <CheckCircle2 size={26} className="mx-auto text-green-600" />

                <p className="mt-2 text-sm font-semibold text-gray-700">
                  You're all caught up
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  No pending assignments right now.
                </p>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/student/assignments")}
            className="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 hover:border-[#B00000] hover:text-[#B00000]"
          >
            View assignments
            <ArrowRight size={15} />
          </button>
        </div>

        {/* Next live class */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <CalendarDays size={20} />
            </div>

            <div>
              <h3 className="font-bold text-gray-900">
                {nextClass && nextClass.type !== "Live Class"
                  ? `Next ${nextClass.type}`
                  : "Next Live Class"}
              </h3>

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
            <div className="mt-5 h-56 animate-pulse rounded-xl bg-gray-100" />
          ) : nextClass ? (
            <div className="mt-5 rounded-xl bg-gray-50 p-5">
              <span
                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                  nextClass.live
                    ? "bg-[#B00000] text-white"
                    : "bg-red-50 text-[#B00000]"
                }`}
              >
                {nextClass.live ? "LIVE NOW" : nextClass.type.toUpperCase()}
              </span>

              <h4 className="mt-3 text-lg font-bold text-gray-900">
                {nextClass.title}
              </h4>

              <p className="mt-1 text-xs text-gray-500">{nextClass.course}</p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <Clock3 size={14} />
                  {formatClassEnd(nextClass.endsAt)} finish
                </span>

                <span className="flex items-center gap-1.5">
                  {nextClass.mode === "Online" ? (
                    <Video size={14} className="text-[#1E3A8A]" />
                  ) : (
                    <MapPin size={14} className="text-[#B00000]" />
                  )}
                  {nextClass.location}
                </span>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <UserAvatar
                  name={nextClass.instructor.name}
                  src={nextClass.instructor.avatarUrl}
                  size={36}
                  tone="bg-[#1E3A8A] text-white"
                />

                <div>
                  <p className="text-xs font-semibold text-gray-700">
                    {nextClass.instructor.name}
                  </p>

                  <p className="text-[11px] text-gray-400">Instructor</p>
                </div>
              </div>

              {nextClass.mode === "Online" && nextClass.meetingLink && (
                <a
                  href={nextClass.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
                >
                  <Video size={17} />
                  Join Class
                </a>
              )}
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-gray-50 px-5 py-10 text-center">
              <CalendarDays size={28} className="mx-auto text-gray-300" />

              <p className="mt-3 text-sm font-semibold text-gray-700">
                No live classes scheduled
              </p>

              <p className="mt-1 text-xs text-gray-500">
                Upcoming live classes from your instructors will appear here.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
