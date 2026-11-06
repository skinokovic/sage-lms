import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Plus,
  Users,
  TrendingUp,
  ClipboardList,
  Award,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import StatCard from "../../components/dashboard/StatCard";
import ActivityList from "../../components/dashboard/ActivityList";
import ProgressBar from "../../components/dashboard/ProgressBar";
import { fetchAdminDashboard } from "../../store/dashboardSlice";

const number = (value) => Number(value || 0).toLocaleString("en-NG");
const percent = (value) =>
  `${Number(value || 0)
    .toFixed(1)
    .replace(/\.0$/, "")}%`;

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [months, setMonths] = useState(6);
  const { data, status, error } = useSelector((state) => state.dashboard);
  const authUser = useSelector((state) => state.auth?.user);

  useEffect(() => {
    dispatch(fetchAdminDashboard(months));
  }, [dispatch, months]);

  const stats = data?.stats || {};
  const enrollmentData = data?.enrollmentData || [];
  const activities = data?.recentActivity || [];
  const courses = data?.popularCourses || [];

  const maxEnrollments = useMemo(
    () => Math.max(1, ...enrollmentData.map((item) => Number(item.value || 0))),
    [enrollmentData],
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    const timeGreeting =
      hour < 12
        ? "Good Morning"
        : hour < 17
          ? "Good Afternoon"
          : "Good Evening";
    const firstName = authUser?.name?.trim()?.split(/\s+/)[0];
    return `${timeGreeting}${firstName ? `, ${firstName}` : ", Admin"}`;
  }, [authUser?.name]);

  const isLoading = status === "loading" && !data;

  const retry = () => dispatch(fetchAdminDashboard(months));

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* WELCOME SECTION */}
      <section className="overflow-hidden rounded-2xl bg-[#1E3A8A] p-5 text-white shadow-sm sm:p-6 lg:p-7">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium text-blue-200">
              Platform overview
            </p>
            <h2 className="mt-1 text-2xl font-bold sm:text-3xl">{greeting}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
              Monitor students, instructors, courses, enrollments and overall
              learning activity from one place.
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <button
              type="button"
              onClick={retry}
              disabled={status === "loading"}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:opacity-60 sm:w-auto"
            >
              <RefreshCw
                size={17}
                className={status === "loading" ? "animate-spin" : ""}
              />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/courses")}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] sm:w-auto"
            >
              <Plus size={18} />
              Manage Courses
            </button>
          </div>
        </div>
      </section>

      {status === "failed" && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3 text-red-800">
            <AlertCircle size={20} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">
                Dashboard data could not be loaded
              </p>
              <p className="mt-1 text-sm">
                {error || "Please check your connection and try again."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={retry}
            className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800"
          >
            Try again
          </button>
        </div>
      )}

      {/* MAIN STATISTICS */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Students"
          value={isLoading ? "—" : number(stats.totalStudents)}
          description="Registered students"
          icon={Users}
        />
        <StatCard
          title="Instructors"
          value={isLoading ? "—" : number(stats.totalInstructors)}
          description="Active instructors"
          icon={GraduationCap}
        />
        <StatCard
          title="Active Courses"
          value={isLoading ? "—" : number(stats.activeCourses)}
          description="Published courses"
          icon={BookOpen}
        />
        <StatCard
          title="Completion Rate"
          value={isLoading ? "—" : percent(stats.completionRate)}
          description="Completed enrollments"
          icon={CheckCircle2}
        />
      </section>

      {/* QUICK OVERVIEW */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Total Enrollments
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoading ? "—" : number(stats.totalEnrollments)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                All recorded course enrollments
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <ClipboardList size={21} />
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Certificates Issued
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoading ? "—" : number(stats.certificatesIssued)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Certificates in the database
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-50 text-yellow-600">
              <Award size={21} />
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/assignments")}
          className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[#B00000]/40"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Assignments
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoading ? "—" : number(stats.totalAssignments)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {isLoading
                  ? "Loading review queue…"
                  : `${number(stats.pendingSubmissions)} submissions awaiting review`}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
              <ClipboardList size={21} />
            </div>
          </div>
        </button>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
                Active Today
              </p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {isLoading ? "—" : number(stats.activeToday)}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                Students with a login today
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <Activity size={21} />
            </div>
          </div>
        </div>
      </section>

      {/* ENROLLMENT + ACTIVITY */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Enrollment Overview
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Monthly course enrollment performance
              </p>
            </div>
            <select
              value={months}
              onChange={(event) => setMonths(Number(event.target.value))}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600 outline-none transition focus:border-[#1E3A8A] sm:w-auto"
            >
              <option value={6}>Last 6 months</option>
              <option value={12}>Last 12 months</option>
            </select>
          </div>

          <div className="mt-8">
            {isLoading ? (
              <div className="flex h-64 items-end gap-3 sm:gap-5">
                {Array.from({ length: months }, (_, index) => (
                  <div
                    key={index}
                    className="h-3/4 flex-1 animate-pulse rounded-t-lg bg-gray-100"
                  />
                ))}
              </div>
            ) : enrollmentData.length === 0 ? (
              <div className="flex h-64 items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-500">
                No enrollment records yet.
              </div>
            ) : (
              <div className="flex h-64 items-end gap-2 sm:gap-4">
                {enrollmentData.map((item) => {
                  const height = Math.max(
                    4,
                    (Number(item.value || 0) / maxEnrollments) * 190,
                  );
                  return (
                    <div
                      key={`${item.year}-${item.month}`}
                      className="group flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
                    >
                      <div className="flex flex-1 items-end">
                        <div className="relative w-full">
                          <div className="absolute -top-10 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[10px] font-medium text-white group-hover:block">
                            {number(item.value)} enrollments
                          </div>
                          <div
                            className="w-full rounded-t-lg bg-[#1E3A8A] transition-all duration-300 group-hover:bg-[#B00000]"
                            style={{ height: `${height}px` }}
                          />
                        </div>
                      </div>
                      <span className="truncate text-center text-[10px] font-medium text-gray-400 sm:text-[11px]">
                        {item.month}
                        {months === 12
                          ? ` '${String(item.year).slice(-2)}`
                          : ""}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-gray-500">All-time enrollments</p>
              <p className="mt-1 text-lg font-bold text-gray-900">
                {isLoading ? "—" : number(stats.totalEnrollments)}
              </p>
            </div>
            <div className="text-xs text-gray-500">
              {data
                ? `${number(data.currentMonthEnrollments)} this month · ${number(data.previousMonthEnrollments)} last month`
                : "Monthly totals from enrollment records"}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Recent Activity
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Latest recorded platform events
              </p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
              <Activity size={18} />
            </div>
          </div>
          <div className="mt-4">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div
                    key={item}
                    className="h-14 animate-pulse rounded-lg bg-gray-100"
                  />
                ))}
              </div>
            ) : activities.length ? (
              <ActivityList activities={activities} />
            ) : (
              <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
                No recent activity to display.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/assignments")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-xs font-semibold text-gray-600 transition hover:border-[#B00000] hover:text-[#B00000]"
          >
            View assignments <ArrowRight size={15} />
          </button>
        </div>
      </section>

      {/* POPULAR COURSES */}
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Popular Courses</h3>
            <p className="mt-1 text-xs text-gray-500">
              Courses with the highest recorded enrollment
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/courses")}
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#B00000] hover:underline"
          >
            Manage courses <ArrowRight size={16} />
          </button>
        </div>

        {isLoading ? (
          <div className="mt-5 space-y-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-16 animate-pulse rounded-xl bg-gray-100"
              />
            ))}
          </div>
        ) : courses.length === 0 ? (
          <p className="mt-5 rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
            No course enrollments have been recorded yet.
          </p>
        ) : (
          <>
            <div className="mt-5 hidden overflow-x-auto md:block">
              <table className="w-full min-w-[700px] text-left">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-3 py-3 font-semibold">Course</th>
                    <th className="px-3 py-3 font-semibold">Instructor</th>
                    <th className="px-3 py-3 font-semibold">Students</th>
                    <th className="px-3 py-3 font-semibold">Completion</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map((course) => (
                    <tr
                      key={course.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50"
                    >
                      <td className="px-3 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                            <BookOpen size={18} />
                          </div>
                          <span className="text-sm font-semibold text-gray-800">
                            {course.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {course.instructor}
                      </td>
                      <td className="px-3 py-4 text-sm font-semibold text-gray-700">
                        {number(course.students)}
                      </td>
                      <td className="w-52 px-3 py-4">
                        <ProgressBar
                          value={course.completion}
                          showValue
                          size="sm"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-5 space-y-3 md:hidden">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border border-gray-100 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#1E3A8A]">
                      <BookOpen size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold leading-5 text-gray-900">
                        {course.name}
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">
                        {course.instructor}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Students enrolled
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-800">
                        {number(course.students)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-[10px] uppercase tracking-wide text-gray-400">
                        Completion
                      </p>
                      <p className="mt-1 text-sm font-bold text-gray-800">
                        {percent(course.completion)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <ProgressBar
                      value={course.completion}
                      showValue
                      size="sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>

      {/* PLATFORM HEALTH */}
      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Platform Status
              </p>
              <p className="text-xs text-green-600">
                {data?.platform?.status ||
                  (isLoading ? "Checking status…" : "Dashboard API responding")}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
              <Users size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Active Today
              </p>
              <p className="text-xs text-gray-500">
                {isLoading
                  ? "Loading activity…"
                  : `${number(stats.activeToday)} students logged in today`}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#B00000]">
              <BarChart3 size={20} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Monthly Enrollment Growth
              </p>
              <p className="text-xs text-gray-500">
                {data
                  ? `${Number(data.enrollmentGrowth || 0) > 0 ? "+" : ""}${Number(data.enrollmentGrowth || 0).toFixed(1)}% compared with last month`
                  : "Calculated from enrollment records"}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
