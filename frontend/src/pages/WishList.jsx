import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Heart,
  Loader2,
  PlayCircle,
  ShoppingCart,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "react-toastify";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../api/axiosClient";
import useEnrolledCourses, { courseLearnPath } from "../hooks/userEnrollment";

const WISHLIST_KEY = "sage_wishlist";
const CART_KEY = "sage_cart";

const readList = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

// What is kept in the browser is small; the rest is refreshed from the server.
const readWishlist = () =>
  readList(WISHLIST_KEY).map((item) => ({
    id: String(item.id),
    title: item.title || "Untitled course",
    image: item.image || "",
    price: Number(item.price || 0),
    originalPrice: Number(item.originalPrice || item.price || 0),
    category: item.category || "Course",
    level: item.level || "",
    instructor: item.instructor || "",
    duration: item.duration || "",
    rating: Number(item.rating || 0),
    unavailable: false,
  }));

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Wishlist() {
  const [items, setItems] = useState(readWishlist);
  const [syncing, setSyncing] = useState(false);

  // Which courses the student already owns, plus one-click free enrollment
  const { isEnrolled, enrollFree, enrollingId } = useEnrolledCourses();

  /* ---------- refresh details and prices from the server ---------- */

  useEffect(() => {
    let cancelled = false;

    const syncWishlist = async () => {
      const stored = readWishlist();
      if (!stored.length) return;

      setSyncing(true);

      const refreshed = await Promise.all(
        stored.map(async (item) => {
          try {
            const response = await axiosClient.get(
              `/courses/public/${item.id}`,
            );
            const payload = response?.data;
            const course =
              payload?.course ||
              payload?.data?.course ||
              payload?.data ||
              payload;

            if (!course || !(course._id || course.id)) {
              throw new Error("Course data missing");
            }

            const price = Number(course.price ?? course.courseFee ?? 0);

            return {
              ...item,
              id: String(course._id || course.id),
              title: course.title || course.name || item.title,
              image:
                course.thumbnail ||
                course.image ||
                course.thumbnailUrl ||
                item.image,
              price,
              originalPrice: Number(
                course.originalPrice ?? course.compareAtPrice ?? price,
              ),
              category:
                typeof course.category === "object"
                  ? course.category?.name || item.category
                  : course.category || item.category,
              level: course.level || item.level,
              instructor:
                typeof course.instructor === "string"
                  ? course.instructor
                  : course.instructor?.name ||
                    course.instructorName ||
                    item.instructor ||
                    "SAGE Instructor",
              duration: course.duration || item.duration || "Self-paced",
              rating: Number(course.rating || 0),
              unavailable: false,
            };
          } catch (error) {
            // Only a missing course counts as unavailable, not a network hiccup.
            return error?.response?.status === 404
              ? { ...item, unavailable: true }
              : item;
          }
        }),
      );

      if (cancelled) return;

      setItems(refreshed);

      // Keep the stored copy fresh (small fields only).
      try {
        localStorage.setItem(
          WISHLIST_KEY,
          JSON.stringify(
            refreshed.map((item) => ({
              id: item.id,
              title: item.title,
              image: item.image,
              price: item.price,
            })),
          ),
        );
      } catch {
        // Storage may be full or blocked; the page still works.
      }

      setSyncing(false);
    };

    syncWishlist();

    // Another tab changed the wishlist.
    const handleStorage = () => setItems(readWishlist());
    window.addEventListener("storage", handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  /* ---------- actions ---------- */

  const removeFromWishlist = (ids) => {
    const removing = new Set(ids.map(String));

    const remaining = readList(WISHLIST_KEY).filter(
      (item) => !removing.has(String(item.id)),
    );

    localStorage.setItem(WISHLIST_KEY, JSON.stringify(remaining));
    window.dispatchEvent(new Event("sage-wishlist-updated"));

    setItems((current) => current.filter((item) => !removing.has(item.id)));
  };

  const buildCartItem = (course) => ({
    id: course.id,
    title: course.title,
    category: course.category,
    instructor: course.instructor || "SAGE Instructor",
    image: course.image || "",
    price: Number(course.price || 0),
    originalPrice: Number(course.originalPrice || course.price || 0),
    duration: course.duration || "Self-paced",
    access: "Lifetime access",
  });

  const addToCartStorage = (courses) => {
    const cart = readList(CART_KEY);
    const inCart = new Set(cart.map((item) => String(item.id)));

    const additions = courses
      .filter((course) => !inCart.has(course.id))
      .map(buildCartItem);

    if (additions.length) {
      localStorage.setItem(CART_KEY, JSON.stringify([...cart, ...additions]));
      window.dispatchEvent(new Event("sage-cart-updated"));
    }
  };

  const moveToCart = (course) => {
    addToCartStorage([course]);
    removeFromWishlist([course.id]);
    toast.success("Moved to your cart.");
  };

  // Paid, available courses the student doesn't own yet
  const buyable = useMemo(
    () =>
      items.filter(
        (item) => !item.unavailable && item.price > 0 && !isEnrolled(item.id),
      ),
    [items, isEnrolled],
  );

  const moveAllToCart = () => {
    if (!buyable.length) return;

    addToCartStorage(buyable);
    removeFromWishlist(buyable.map((item) => item.id));
    toast.success(
      `${buyable.length} ${buyable.length === 1 ? "course" : "courses"} moved to your cart.`,
    );
  };

  const clearWishlist = () => {
    if (!items.length) return;

    if (!window.confirm("Remove every course from your wishlist?")) return;

    removeFromWishlist(items.map((item) => item.id));
    toast.info("Your wishlist is now empty.");
  };

  return (
    <div className="min-h-screen bg-surface text-heading">
      <Navbar />

      {/* Header */}
      <section className="border-b border-line bg-linear-to-br from-slate-50 via-white to-red-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="flex items-center gap-2 text-xs font-semibold text-body">
            <Link to="/courses" className="cursor-pointer hover:text-primary">
              Courses
            </Link>
            <ChevronRight size={14} />
            <span>Wishlist</span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Heart size={14} />
                Saved for later
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                My wishlist
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-body sm:text-base">
                Courses you've saved are kept here. Move one to your cart when
                you're ready to enroll.
              </p>
            </div>

            <Link
              to="/courses"
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-heading shadow-sm hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={16} />
              Continue browsing
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <Heart size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Your wishlist is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-body">
              Tap the heart on any course to save it here and come back to it
              later.
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Explore courses <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <>
            {/* Toolbar */}
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold sm:text-xl">
                  {items.length} {items.length === 1 ? "course" : "courses"}{" "}
                  saved
                </h2>
                <p className="mt-1 text-sm text-body">Saved in this browser.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {buyable.length > 1 && (
                  <button
                    type="button"
                    onClick={moveAllToCart}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary/90"
                  >
                    <ShoppingCart size={16} />
                    Add all to cart
                  </button>
                )}

                <button
                  type="button"
                  onClick={clearWishlist}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-heading shadow-sm hover:border-red-200 hover:text-red-600"
                >
                  <Trash2 size={16} />
                  Clear wishlist
                </button>
              </div>
            </div>

            {syncing && (
              <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                Refreshing course details and prices from SAGE…
              </div>
            )}

            {/* Cards */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((course) => {
                const enrolled = isEnrolled(course.id);
                const isFree = course.price === 0;
                const enrolling = enrollingId === course.id;

                return (
                  <article
                    key={course.id}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  >
                    <div className="relative overflow-hidden bg-surface-muted">
                      <Link
                        to={`/courses/${course.id}`}
                        className="block"
                        tabIndex={course.unavailable ? -1 : 0}
                      >
                        {course.image ? (
                          <img
                            src={course.image}
                            alt={course.title}
                            loading="lazy"
                            className={`aspect-[16/10] w-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                              course.unavailable ? "opacity-50 grayscale" : ""
                            }`}
                          />
                        ) : (
                          <div className="flex aspect-[16/10] w-full items-center justify-center bg-gradient-to-br from-[#1E3A8A] to-[#B00000] text-white">
                            <BookOpen size={38} />
                          </div>
                        )}
                      </Link>

                      <button
                        type="button"
                        onClick={() => removeFromWishlist([course.id])}
                        aria-label={`Remove ${course.title} from wishlist`}
                        title="Remove from wishlist"
                        className="absolute right-3 top-3 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/95 shadow-lg transition hover:scale-105"
                      >
                        <Heart
                          size={18}
                          className="fill-primary text-primary"
                        />
                      </button>
                    </div>

                    <div className="flex flex-1 flex-col p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/5 px-2.5 py-1 text-xs font-semibold text-primary">
                          {course.category || "Course"}
                        </span>

                        {course.level && (
                          <span className="text-xs text-body">
                            {course.level}
                          </span>
                        )}

                        {course.unavailable && (
                          <span className="rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                            Unavailable
                          </span>
                        )}
                      </div>

                      <Link to={`/courses/${course.id}`}>
                        <h3 className="mt-3 line-clamp-2 min-h-12 text-base font-bold leading-6 text-heading transition-colors group-hover:text-primary">
                          {course.title}
                        </h3>
                      </Link>

                      {course.instructor && (
                        <p className="mt-2 truncate text-sm text-body">
                          By {course.instructor}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        {course.rating > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-semibold text-heading">
                            <Star
                              size={14}
                              fill="currentColor"
                              className="text-amber-500"
                            />
                            {course.rating.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">
                            Not rated yet
                          </span>
                        )}

                        {course.duration && (
                          <span className="inline-flex items-center gap-1 text-xs text-body">
                            <Clock3 size={13} />
                            {course.duration}
                          </span>
                        )}
                      </div>

                      {/* Price + action */}
                      <div className="mt-auto border-t border-line pt-4 mt-4">
                        <div className="flex items-center justify-between gap-3">
                          {course.unavailable ? (
                            <span className="text-sm font-semibold text-body">
                              No longer available
                            </span>
                          ) : enrolled ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-bold text-emerald-700">
                              <CheckCircle2 size={15} />
                              Enrolled
                            </span>
                          ) : (
                            <div className="flex flex-wrap items-baseline gap-2">
                              <span
                                className={`text-lg font-extrabold ${
                                  isFree ? "text-emerald-600" : "text-heading"
                                }`}
                              >
                                {isFree ? "Free" : money(course.price)}
                              </span>
                              {!isFree &&
                                course.originalPrice > course.price && (
                                  <span className="text-xs text-body line-through">
                                    {money(course.originalPrice)}
                                  </span>
                                )}
                            </div>
                          )}
                        </div>

                        {!course.unavailable && (
                          <div className="mt-3">
                            {enrolled ? (
                              <Link
                                to={courseLearnPath(course.id)}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90"
                              >
                                <PlayCircle size={16} />
                                Continue learning
                              </Link>
                            ) : isFree ? (
                              <button
                                type="button"
                                onClick={() => enrollFree(course)}
                                disabled={enrolling}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                              >
                                {enrolling ? (
                                  <>
                                    <Loader2
                                      size={16}
                                      className="animate-spin"
                                    />
                                    Enrolling…
                                  </>
                                ) : (
                                  <>
                                    Enroll for free <ArrowRight size={16} />
                                  </>
                                )}
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => moveToCart(course)}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-primary px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-red-50"
                              >
                                <ShoppingCart size={16} />
                                Move to cart
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
