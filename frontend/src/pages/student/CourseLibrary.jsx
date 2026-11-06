import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Filter,
  GraduationCap,
  Heart,
  Loader2,
  PlayCircle,
  Search,
  ShoppingCart,
  Star,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchLibraryCourses } from "../../store/studentLibrarySlice";
import useEnrolledCourses, {
  courseLearnPath,
} from "../../hooks/userEnrollment";

const CART_KEY = "sage_cart";
const WISHLIST_KEY = "sage_wishlist";

const levels = ["Any Level", "Beginner", "Intermediate", "Advanced"];
const priceOptions = ["Any Price", "Free", "Paid"];
const sortOptions = [
  "Newest",
  "Most Popular",
  "Highest Rated",
  "Price: Low to High",
  "Price: High to Low",
];

const readStorageArray = (key) => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const idSet = (key) =>
  new Set(readStorageArray(key).map((item) => String(item.id)));

const CourseLibrary = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    items: coursesData,
    status: loadStatus,
    error,
  } = useSelector((state) => state.studentLibrary);

  // Courses the student owns + one-click free enrollment
  const { isEnrolled, enrollFree, enrollingId, ready } = useEnrolledCourses();

  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState("All Categories");
  const [level, setLevel] = useState("Any Level");
  const [price, setPrice] = useState("Any Price");
  const [sortBy, setSortBy] = useState("Newest");

  const [cartIds, setCartIds] = useState(() => idSet(CART_KEY));
  const [wishlistIds, setWishlistIds] = useState(() => idSet(WISHLIST_KEY));

  useEffect(() => {
    dispatch(fetchLibraryCourses());
  }, [dispatch]);

  // Keep the heart/cart buttons in step with other pages and tabs
  useEffect(() => {
    const refresh = () => {
      setCartIds(idSet(CART_KEY));
      setWishlistIds(idSet(WISHLIST_KEY));
    };

    window.addEventListener("sage-cart-updated", refresh);
    window.addEventListener("sage-wishlist-updated", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("sage-cart-updated", refresh);
      window.removeEventListener("sage-wishlist-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const isLoading = loadStatus === "idle" || loadStatus === "loading";
  const hasFailed = loadStatus === "failed";

  const categories = useMemo(
    () => [
      "All Categories",
      ...Array.from(
        new Set(coursesData.map((course) => course.category)),
      ).sort(),
    ],
    [coursesData],
  );

  const filteredCourses = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();

    const list = coursesData.filter((course) => {
      const matchesSearch =
        !search ||
        course.title.toLowerCase().includes(search) ||
        course.description.toLowerCase().includes(search) ||
        course.instructor.toLowerCase().includes(search) ||
        course.category.toLowerCase().includes(search);

      const matchesCategory =
        category === "All Categories" || course.category === category;

      const matchesLevel = level === "Any Level" || course.level === level;

      const matchesPrice =
        price === "Any Price" ||
        (price === "Free" ? course.price === 0 : course.price > 0);

      return matchesSearch && matchesCategory && matchesLevel && matchesPrice;
    });

    const sorted = [...list];
    switch (sortBy) {
      case "Most Popular":
        sorted.sort((a, b) => b.students - a.students);
        break;
      case "Highest Rated":
        sorted.sort((a, b) => b.rating - a.rating);
        break;
      case "Price: Low to High":
        sorted.sort((a, b) => a.price - b.price);
        break;
      case "Price: High to Low":
        sorted.sort((a, b) => b.price - a.price);
        break;
      default:
        sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return sorted;
  }, [coursesData, searchTerm, category, level, price, sortBy]);

  const hasActiveFilters =
    searchTerm ||
    category !== "All Categories" ||
    level !== "Any Level" ||
    price !== "Any Price";

  const clearFilters = () => {
    setSearchTerm("");
    setCategory("All Categories");
    setLevel("Any Level");
    setPrice("Any Price");
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleContinue = (courseId) => {
    navigate(courseLearnPath(courseId));
  };

  const toggleWishlist = (course) => {
    const list = readStorageArray(WISHLIST_KEY);
    const exists = list.some((item) => String(item.id) === course.id);

    const next = exists
      ? list.filter((item) => String(item.id) !== course.id)
      : [
          ...list,
          {
            id: course.id,
            title: course.title,
            image: course.image,
            price: course.price,
          },
        ];

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("sage-wishlist-updated"));
    setWishlistIds(new Set(next.map((item) => String(item.id))));

    if (exists) toast.info("Removed from your wishlist.");
    else toast.success("Saved to your wishlist.");
  };

  const handleCart = (course) => {
    if (cartIds.has(course.id)) {
      navigate("/cart");
      return;
    }

    const cart = readStorageArray(CART_KEY);

    localStorage.setItem(
      CART_KEY,
      JSON.stringify([
        ...cart,
        {
          id: course.id,
          title: course.title,
          category: course.category,
          instructor: course.instructor,
          image: course.image,
          price: course.price,
          originalPrice: course.price,
          duration: course.duration,
          students: course.students,
          lessons: course.lessons,
          access: "Lifetime access",
        },
      ]),
    );

    window.dispatchEvent(new Event("sage-cart-updated"));
    setCartIds(idSet(CART_KEY));
    toast.success("Course added to cart.");
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A]/10 text-[#1E3A8A]">
            <BookOpen size={22} />
          </div>

          <span className="text-sm font-semibold text-[#1E3A8A]">
            Explore Learning
          </span>
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
          Course Library
        </h1>

        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Explore our collection of courses and find the right learning path for
          your goals.
        </p>
      </div>

      {/* HERO SEARCH */}
      <div className="overflow-hidden rounded-2xl bg-[#1E3A8A] shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-20 right-32 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative">
            <h2 className="text-xl font-bold text-white sm:text-2xl">
              What do you want to learn?
            </h2>

            <p className="mt-2 text-sm text-blue-100">
              Search through our courses and start learning today.
            </p>

            <div className="relative mt-5 max-w-3xl">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search courses, topics or instructors..."
                className="w-full rounded-xl border-0 bg-white py-4 pl-12 pr-4 text-sm text-gray-900 shadow-lg outline-none placeholder:text-gray-400 focus:ring-4 focus:ring-white/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />

            <span className="text-sm font-semibold text-gray-700">
              Filter Courses
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:flex">
            <SelectBox
              value={category}
              onChange={setCategory}
              options={categories}
              minWidth="xl:min-w-[190px]"
            />

            <SelectBox
              value={level}
              onChange={setLevel}
              options={levels}
              minWidth="xl:min-w-[150px]"
            />

            <SelectBox
              value={price}
              onChange={setPrice}
              options={priceOptions}
              minWidth="xl:min-w-[140px]"
            />

            <SelectBox
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              minWidth="xl:min-w-[180px]"
            />

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
              >
                <XCircle size={16} />
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RESULTS HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Available Courses</h2>

          <p className="mt-1 text-sm text-gray-500">
            Showing {filteredCourses.length}{" "}
            {filteredCourses.length === 1 ? "course" : "courses"}
          </p>
        </div>
      </div>

      {/* COURSE GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-48 bg-gray-100" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-3/4 rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-11 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : hasFailed ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <BookOpen size={30} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900">
            Couldn't load the course library
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{error}</p>

          <button
            type="button"
            onClick={() => dispatch(fetchLibraryCourses())}
            className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              course={course}
              ready={ready}
              enrolled={isEnrolled(course.id)}
              enrolling={enrollingId === course.id}
              inCart={cartIds.has(course.id)}
              saved={wishlistIds.has(course.id)}
              onView={handleViewCourse}
              onContinue={handleContinue}
              onEnrollFree={() => enrollFree(course)}
              onCart={() => handleCart(course)}
              onWishlist={() => toggleWishlist(course)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          noCourses={coursesData.length === 0}
          onClear={clearFilters}
        />
      )}
    </div>
  );
};

/* -------------------------------- */
/* SELECT BOX */
/* -------------------------------- */

const SelectBox = ({ value, onChange, options, minWidth }) => (
  <div className="relative">
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-4 pr-10 text-sm text-gray-700 outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10 ${minWidth}`}
    >
      {options.map((item) => (
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
);

/* -------------------------------- */
/* COURSE CARD */
/* -------------------------------- */

const CourseCard = ({
  course,
  ready,
  enrolled,
  enrolling,
  inCart,
  saved,
  onView,
  onContinue,
  onEnrollFree,
  onCart,
  onWishlist,
}) => {
  const isFree = course.price === 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      {/* IMAGE */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <Link to={`/courses/${course.id}`} className="block h-full w-full">
          {course.image ? (
            <img
              src={course.image}
              alt={course.title}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#B00000] text-white">
              <BookOpen size={40} />
            </div>
          )}
        </Link>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* CATEGORY */}
        <span className="absolute left-4 top-4 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] shadow-sm">
          {course.category}
        </span>

        {/* PRICE / ENROLLED */}
        {enrolled ? (
          <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <CheckCircle2 size={13} />
            ENROLLED
          </span>
        ) : (
          <span
            className={`absolute right-4 top-4 rounded-lg px-3 py-1.5 text-xs font-bold shadow-sm ${
              isFree ? "bg-green-500 text-white" : "bg-white text-[#B00000]"
            }`}
          >
            {isFree ? "FREE" : `₦${course.price.toLocaleString("en-NG")}`}
          </span>
        )}

        {/* LEVEL */}
        <span className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
          {course.level}
        </span>
      </div>

      {/* CONTENT */}
      <div className="flex flex-1 flex-col p-5">
        <Link to={`/courses/${course.id}`}>
          <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-bold text-gray-900 transition group-hover:text-[#1E3A8A]">
            {course.title}
          </h3>
        </Link>

        <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm leading-5 text-gray-500">
          {course.description}
        </p>

        {/* INSTRUCTOR */}
        <div className="mt-4 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A]">
            <GraduationCap size={16} />
          </div>

          <div>
            <p className="text-[11px] text-gray-400">Instructor</p>
            <p className="text-sm font-semibold text-gray-700">
              {course.instructor}
            </p>
          </div>
        </div>

        {/* RATING */}
        <div className="mt-4 flex items-center gap-2">
          {course.rating > 0 ? (
            <div className="flex items-center gap-1">
              <Star size={16} className="fill-yellow-400 text-yellow-400" />

              <span className="text-sm font-bold text-gray-800">
                {course.rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Not rated yet</span>
          )}
        </div>

        {/* COURSE INFO */}
        <div className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-4">
          <InfoItem icon={Clock3} text={course.duration} />
          <InfoItem icon={BookOpen} text={`${course.lessons} lessons`} />
          <InfoItem icon={Users} text={`${course.students} students`} />
          <InfoItem icon={PlayCircle} text={course.level} />
        </div>

        {/* ACTIONS */}
        <div className="mt-auto flex items-center gap-2 pt-5">
          {enrolled ? (
            <button
              type="button"
              onClick={() => onContinue(course.id)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-900"
            >
              <PlayCircle size={17} />
              Continue Learning
            </button>
          ) : isFree ? (
            <button
              type="button"
              onClick={onEnrollFree}
              disabled={enrolling || !ready}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {enrolling ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Enrolling…
                </>
              ) : (
                <>
                  Enroll for Free
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onView(course.id)}
              className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              <PlayCircle size={17} />
              View Course
            </button>
          )}

          {!enrolled && !isFree && (
            <button
              type="button"
              onClick={onCart}
              aria-label={inCart ? "View cart" : "Add to cart"}
              title={inCart ? "View cart" : "Add to cart"}
              className={`flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-xl border transition ${
                inCart
                  ? "border-[#B00000] bg-red-50 text-[#B00000]"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <ShoppingCart size={18} />
            </button>
          )}

          <button
            type="button"
            onClick={onWishlist}
            aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={saved}
            title={saved ? "Remove from wishlist" : "Save to wishlist"}
            className="flex h-[46px] w-[46px] shrink-0 cursor-pointer items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50"
          >
            <Heart
              size={18}
              className={
                saved ? "fill-[#B00000] text-[#B00000]" : "text-gray-600"
              }
            />
          </button>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* INFO ITEM */
/* -------------------------------- */

const InfoItem = ({ icon: Icon, text }) => {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <Icon size={15} className="shrink-0 text-gray-400" />

      <span className="truncate text-xs font-medium text-gray-500">{text}</span>
    </div>
  );
};

/* -------------------------------- */
/* EMPTY STATE */
/* -------------------------------- */

const EmptyState = ({ noCourses, onClear }) => {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Search size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        {noCourses ? "No courses available yet" : "No courses found"}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {noCourses
          ? "New courses will appear here as soon as they are published."
          : "We couldn't find any courses matching your search or selected filters. Try changing your search criteria."}
      </p>

      {!noCourses && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 cursor-pointer rounded-xl bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#172f70]"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
};

export default CourseLibrary;
