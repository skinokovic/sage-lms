import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Search,
  Users,
  X,
} from "lucide-react";
import { fetchMyCourses } from "../../store/studentCourseSlice"; // adjust path

const filters = ["All", "In Progress", "Completed", "Not Started"];

const MyCourses = () => {
  const dispatch = useDispatch();
  const {
    items: courses,
    status: loadStatus,
    error,
  } = useSelector((state) => state.studentCourses);

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    dispatch(fetchMyCourses());
  }, [dispatch]);

  const isLoading = loadStatus === "idle" || loadStatus === "loading";
  const hasFailed = loadStatus === "failed";

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.category.toLowerCase().includes(search.toLowerCase()) ||
        course.instructor.toLowerCase().includes(search.toLowerCase());

      const matchesFilter =
        activeFilter === "All" || course.status === activeFilter;

      return matchesSearch && matchesFilter;
    });
  }, [courses, search, activeFilter]);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-50 text-green-700";
      case "In Progress":
        return "bg-blue-50 text-[#1E3A8A]";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#B00000]">Student Learning</p>

          <h1 className="mt-1 text-2xl font-bold text-gray-900 sm:text-3xl">
            My Courses
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Track your enrolled courses and continue your learning journey.
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-500">
          <BookOpen size={18} className="text-[#1E3A8A]" />
          <span>
            <strong className="text-gray-900">{courses.length}</strong> enrolled
            courses
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={BookOpen}
          title="Total Courses"
          value={courses.length}
          description="Enrolled courses"
          iconClass="bg-blue-50 text-[#1E3A8A]"
        />

        <SummaryCard
          icon={PlayCircle}
          title="In Progress"
          value={
            courses.filter((course) => course.status === "In Progress").length
          }
          description="Currently learning"
          iconClass="bg-red-50 text-[#B00000]"
        />

        <SummaryCard
          icon={CheckCircle2}
          title="Completed"
          value={
            courses.filter((course) => course.status === "Completed").length
          }
          description="Courses completed"
          iconClass="bg-green-50 text-green-600"
        />

        <SummaryCard
          icon={Clock3}
          title="Not Started"
          value={
            courses.filter((course) => course.status === "Not Started").length
          }
          description="Ready to begin"
          iconClass="bg-gray-100 text-gray-600"
        />
      </div>

      {/* Search + Filters */}
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
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search your courses..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-blue-100"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Clear search"
              >
                <X size={17} />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  activeFilter === filter
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-48 bg-gray-100" />
              <div className="space-y-3 p-5">
                <div className="h-3 w-24 rounded bg-gray-100" />
                <div className="h-5 w-3/4 rounded bg-gray-100" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-2 w-full rounded-full bg-gray-100" />
                <div className="h-11 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : hasFailed ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <BookOpen size={30} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Couldn't load your courses
          </h3>

          <p className="mt-2 text-sm text-gray-500">{error}</p>

          <button
            type="button"
            onClick={() => dispatch(fetchMyCourses())}
            className="mt-5 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseItem
              key={course.id}
              course={course}
              statusStyle={getStatusStyle(course.status)}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
            <BookOpen size={30} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No courses found
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            {courses.length === 0
              ? "You haven't enrolled in any courses yet."
              : "Try changing your search or selecting a different filter."}
          </p>

          {courses.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setActiveFilter("All");
              }}
              className="mt-5 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, description, iconClass }) => {
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

const CourseItem = ({ course, statusStyle }) => {
  const navigate = useNavigate();
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      {/* Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        {course.image ? (
          <img
            src={course.image}
            alt={course.title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <BookOpen size={40} />
          </div>
        )}

        <div className="absolute left-4 top-4">
          <span
            className={`rounded-full px-3 py-1.5 text-xs font-semibold shadow-sm ${statusStyle}`}
          >
            {course.status}
          </span>
        </div>

        {course.progress > 0 && course.progress < 100 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/40">
            <div
              className="h-full bg-[#B00000]"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#B00000]">
          {course.category}
        </p>

        <h2 className="mt-2 min-h-[3.5rem] text-lg font-bold leading-7 text-gray-900">
          {course.title}
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Instructor:{" "}
          <span className="font-medium text-gray-700">{course.instructor}</span>
        </p>

        {/* Course Information */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-y border-gray-100 py-4">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <BookOpen size={15} className="text-[#1E3A8A]" />
            {course.completedLessons}/{course.totalLessons} lessons
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock3 size={15} className="text-[#1E3A8A]" />
            {course.duration}
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Users size={15} className="text-[#1E3A8A]" />
            {course.students} students
          </div>

          <div className="text-right text-xs text-gray-400">
            {course.lastAccessed}
          </div>
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500">
              Course Progress
            </span>

            <span className="text-sm font-bold text-[#1E3A8A]">
              {course.progress}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#B00000] transition-all"
              style={{ width: `${course.progress}%` }}
            />
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() =>
            navigate(`/dashboard/student/courses/${course.id}/learn`)
          }
          type="button"
          className={`mt-5 flex w-full items-center cursor-pointer justify-center gap-2  rounded-xl px-4 py-3 text-sm font-semibold transition ${
            course.status === "Completed"
              ? "border border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100"
              : course.status === "Not Started"
                ? "bg-[#1E3A8A] text-white hover:bg-blue-900"
                : "bg-[#B00000] text-white hover:bg-[#8f0000]"
          }`}
        >
          {course.status === "Completed" ? (
            <>
              <CheckCircle2 size={17} />
              View Course
            </>
          ) : course.status === "Not Started" ? (
            <>
              <PlayCircle size={17} />
              Start Course
            </>
          ) : (
            <>
              <PlayCircle size={17} />
              Continue Learning
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MyCourses;
