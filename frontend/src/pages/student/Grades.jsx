import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  GraduationCap,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { fetchMyGrades } from "../../store/studentGradeSlice";

const PASS_MARK = 60; // matches the grading scale (F is below 60)

const Grades = () => {
  const dispatch = useDispatch();
  const {
    items: grades,
    status: loadStatus,
    error,
  } = useSelector((state) => state.studentGrades);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Categories");

  useEffect(() => {
    dispatch(fetchMyGrades());
  }, [dispatch]);

  const isLoading = loadStatus === "idle" || loadStatus === "loading";
  const hasFailed = loadStatus === "failed";

  const categories = useMemo(
    () => [
      "All Categories",
      ...Array.from(new Set(grades.map((item) => item.category))).sort(),
    ],
    [grades],
  );

  const gradedCourses = grades.filter((item) => item.percent !== null);
  const hasGrades = gradedCourses.length > 0;

  const averageScore = hasGrades
    ? Math.round(
        gradedCourses.reduce((total, item) => total + item.percent, 0) /
          gradedCourses.length,
      )
    : 0;

  const highestScore = hasGrades
    ? Math.max(...gradedCourses.map((item) => item.percent))
    : 0;

  const passedCourses = gradedCourses.filter(
    (item) => item.percent >= PASS_MARK,
  ).length;

  const gpa = (averageScore / 25).toFixed(2);

  const filteredGrades = useMemo(() => {
    return grades.filter((item) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        item.course.toLowerCase().includes(searchText) ||
        item.category.toLowerCase().includes(searchText) ||
        item.instructor.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All Categories" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [grades, search, category]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B00000]">
            Academic Performance
          </p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            Grades
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Review your course grades and track your academic progress.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <GraduationCap size={19} className="text-[#1E3A8A]" />

          <span>
            <strong className="text-gray-900">{gradedCourses.length}</strong>{" "}
            graded courses
          </span>
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <PerformanceCard
          icon={BarChart3}
          title="Average Score"
          value={`${averageScore}%`}
          description="Across graded courses"
          iconClass="bg-blue-50 text-[#1E3A8A]"
        />

        <PerformanceCard
          icon={Award}
          title="GPA"
          value={gpa}
          description="Current estimated GPA"
          iconClass="bg-red-50 text-[#B00000]"
        />

        <PerformanceCard
          icon={TrendingUp}
          title="Highest Score"
          value={`${highestScore}%`}
          description="Best course performance"
          iconClass="bg-green-50 text-green-600"
        />

        <PerformanceCard
          icon={CheckCircle2}
          title="Courses Passed"
          value={passedCourses}
          description={`Out of ${gradedCourses.length} graded`}
          iconClass="bg-purple-50 text-purple-600"
        />
      </div>

      {/* Academic Performance Banner */}
      <div className="overflow-hidden rounded-2xl bg-[#1E3A8A] text-white shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">
                Overall Performance
              </p>

              <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
                {hasGrades ? "Keep up the great work!" : "No grades yet"}
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-blue-100">
                {hasGrades ? (
                  <>
                    Your current average is{" "}
                    <strong className="text-white">{averageScore}%</strong>.
                    Continue completing your courses and assignments to maintain
                    your academic progress.
                  </>
                ) : (
                  "Your grades will appear here once your instructors have graded your assignments."
                )}
              </p>
            </div>

            <div className="flex h-28 w-28 shrink-0 flex-col items-center justify-center rounded-full border-8 border-white/20 bg-white/10">
              <span className="text-3xl font-bold">{averageScore}%</span>

              <span className="text-[10px] uppercase tracking-wider text-blue-200">
                Average
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Search / Filter */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search courses or instructors..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* Category */}
          <div className="relative w-full lg:w-64">
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            >
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            <ChevronDown
              size={17}
              className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
          </div>
        </div>
      </div>

      {/* Grades Table / Cards */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Course Grades</h2>

              <p className="mt-1 text-xs text-gray-500">
                Your current academic results
              </p>
            </div>

            <span className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              {filteredGrades.length} courses
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((n) => (
              <div key={n} className="animate-pulse space-y-3 px-6 py-5">
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-3 w-1/4 rounded bg-gray-100" />
                <div className="h-2 w-1/2 rounded-full bg-gray-100" />
              </div>
            ))}
          </div>
        ) : hasFailed ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
              <GraduationCap size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Couldn't load your grades
            </h3>

            <p className="mt-2 text-sm text-gray-500">{error}</p>

            <button
              type="button"
              onClick={() => dispatch(fetchMyGrades())}
              className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Try Again
            </button>
          </div>
        ) : filteredGrades.length > 0 ? (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left">
                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Course
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Instructor
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Score
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Grade
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Performance
                    </th>

                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredGrades.map((item) => (
                    <GradeRow key={item.id} item={item} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 md:hidden">
              {filteredGrades.map((item) => (
                <GradeMobileCard key={item.id} item={item} />
              ))}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
              <GraduationCap size={30} />
            </div>

            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              No grades found
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {grades.length === 0
                ? "You haven't enrolled in any courses yet."
                : "Try changing your search or category filter."}
            </p>

            {grades.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All Categories");
                }}
                className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Grading Scale */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <BookOpen size={20} />
          </div>

          <div>
            <h2 className="font-bold text-gray-900">Grading Scale</h2>

            <p className="text-xs text-gray-500">Current grading system</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <ScaleItem grade="A" range="90 - 100" description="Excellent" />

          <ScaleItem grade="B" range="80 - 89" description="Very Good" />

          <ScaleItem grade="C" range="70 - 79" description="Good" />

          <ScaleItem grade="D" range="60 - 69" description="Pass" />

          <ScaleItem grade="F" range="Below 60" description="Fail" />
        </div>
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Performance Card
|--------------------------------------------------------------------------
*/

const PerformanceCard = ({
  icon: Icon,
  title,
  value,
  description,
  iconClass,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

const performanceClass = (grade) =>
  ({
    A: "text-green-600",
    B: "text-blue-600",
    C: "text-amber-600",
    D: "text-gray-600",
    F: "text-[#B00000]",
  })[grade] || "text-gray-500";

/*
|--------------------------------------------------------------------------
| Desktop Grade Row
|--------------------------------------------------------------------------
*/

const GradeRow = ({ item }) => {
  const barWidth = Math.min(item.percent ?? 0, 100);

  return (
    <tr className="border-b border-gray-100 transition last:border-0 hover:bg-gray-50">
      {/* Course */}
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <BookOpen size={18} />
          </div>

          <div>
            <p className="font-semibold text-gray-900">{item.course}</p>

            <p className="mt-1 text-xs text-gray-400">
              {item.category} · {item.gradedAssignments}/{item.totalAssignments}{" "}
              graded
            </p>
          </div>
        </div>
      </td>

      {/* Instructor */}
      <td className="px-6 py-5">
        <p className="text-sm text-gray-600">{item.instructor}</p>
      </td>

      {/* Score */}
      <td className="px-6 py-5">
        {item.percent !== null ? (
          <div>
            <p className="font-bold text-gray-900">
              {item.score}/{item.totalMarks}
              <span className="ml-2 text-xs font-medium text-gray-400">
                {item.percent}%
              </span>
            </p>

            <div className="mt-2 h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-[#B00000]"
                style={{
                  width: `${barWidth}%`,
                }}
              />
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Not graded</span>
        )}
      </td>

      {/* Grade */}
      <td className="px-6 py-5">
        <GradeBadge grade={item.grade} />
      </td>

      {/* Performance */}
      <td className="px-6 py-5">
        <span className={`text-sm font-medium ${performanceClass(item.grade)}`}>
          {item.status}
        </span>
      </td>

      {/* Status */}
      <td className="px-6 py-5">
        {item.completed ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700">
            <CheckCircle2 size={13} />
            Completed
          </span>
        ) : (
          <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A]">
            In Progress
          </span>
        )}
      </td>
    </tr>
  );
};

/*
|--------------------------------------------------------------------------
| Mobile Grade Card
|--------------------------------------------------------------------------
*/

const GradeMobileCard = ({ item }) => {
  const barWidth = Math.min(item.percent ?? 0, 100);

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
            <BookOpen size={18} />
          </div>

          <div className="min-w-0">
            <p className="font-semibold text-gray-900">{item.course}</p>

            <p className="mt-1 text-xs text-gray-400">
              {item.category} · {item.gradedAssignments}/{item.totalAssignments}{" "}
              graded
            </p>
          </div>
        </div>

        <GradeBadge grade={item.grade} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-400">Instructor</p>

          <p className="mt-1 text-sm font-medium text-gray-700">
            {item.instructor}
          </p>
        </div>

        <div>
          <p className="text-xs text-gray-400">Performance</p>

          <p
            className={`mt-1 text-sm font-medium ${performanceClass(item.grade)}`}
          >
            {item.status}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-xl bg-gray-50 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-500">Score</span>

          {item.percent !== null ? (
            <span className="text-sm font-bold text-gray-900">
              {item.score}/{item.totalMarks}
              <span className="ml-2 text-xs font-medium text-gray-400">
                {item.percent}%
              </span>
            </span>
          ) : (
            <span className="text-sm text-gray-400">Not graded</span>
          )}
        </div>

        {item.percent !== null && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-[#B00000]"
              style={{
                width: `${barWidth}%`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

/*
|--------------------------------------------------------------------------
| Grade Badge
|--------------------------------------------------------------------------
*/

const GradeBadge = ({ grade }) => {
  if (grade === "—") {
    return (
      <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-xl bg-gray-100 px-3 text-sm font-bold text-gray-400">
        —
      </span>
    );
  }

  return (
    <span
      className={`inline-flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold ${
        grade === "A"
          ? "bg-green-50 text-green-700"
          : grade === "B"
            ? "bg-blue-50 text-[#1E3A8A]"
            : grade === "C"
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-[#B00000]"
      }`}
    >
      {grade}
    </span>
  );
};

/*
|--------------------------------------------------------------------------
| Grading Scale Item
|--------------------------------------------------------------------------
*/

const ScaleItem = ({ grade, range, description }) => {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#1E3A8A] shadow-sm">
        {grade}
      </div>

      <p className="mt-3 text-sm font-semibold text-gray-900">{range}</p>

      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
};

export default Grades;
