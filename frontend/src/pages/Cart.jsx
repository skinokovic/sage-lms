import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  LockKeyhole,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Trash2,
  Tag,
  Users,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import CouponBox from "../components/CouponBox";
import axiosClient from "../api/axiosClient";
import { toast } from "react-toastify";
import useEnrolledCourses from "../hooks/userEnrollment";
import useCoupon from "../hooks/useCoupon";

const CART_KEY = "sage_cart";

const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export default function Cart() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState(readCart);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [synced, setSynced] = useState(false);

  // The coupon applied to this cart (the server works out every price)
  const coupon = useCoupon(items);

  // Courses the student already owns can't be bought again
  const { enrolledIds, ready: enrollmentsReady } = useEnrolledCourses();

  const syncCartWithDatabase = async () => {
    const stored = readCart();
    if (!stored.length) {
      setItems([]);
      setSyncError(false);
      setSynced(true);
      return;
    }

    setSyncing(true);
    setSyncError(false);
    const results = await Promise.all(
      stored.map(async (item) => {
        const courseId = item.courseId || item.id || item._id;
        if (!courseId) return { ...item, unavailable: true };
        try {
          const response = await axiosClient.get(`/courses/public/${courseId}`);
          const payload = response?.data;
          const course =
            payload?.course ||
            payload?.data?.course ||
            payload?.data ||
            payload;
          if (!course || !(course._id || course.id))
            throw new Error("Course data missing");

          const price = Number(course.price ?? course.courseFee ?? 0);
          const originalPrice = Number(
            course.originalPrice ?? course.compareAtPrice ?? price,
          );
          const instructor =
            typeof course.instructor === "string"
              ? course.instructor
              : course.instructor?.name ||
                course.instructorName ||
                item.instructor ||
                "SAGE Instructor";
          return {
            ...item,
            id: String(course._id || course.id),
            courseId: String(course._id || course.id),
            title:
              course.title || course.name || item.title || "Untitled course",
            category:
              typeof course.category === "object"
                ? course.category?.name || item.category
                : course.category || item.category || "Course",
            instructor,
            image:
              course.thumbnail ||
              course.image ||
              course.thumbnailUrl ||
              item.image ||
              "",
            price,
            originalPrice,
            duration:
              course.duration ||
              course.estimatedDuration ||
              item.duration ||
              "Self-paced",
            unavailable: false,
          };
        } catch (error) {
          console.warn(
            `Unable to refresh course ${courseId}:`,
            error?.message || error,
          );
          return { ...item, unavailable: true };
        }
      }),
    );

    const hasUnavailable = results.some((item) => item.unavailable);
    setItems(results);
    setSyncError(hasUnavailable);
    localStorage.setItem(CART_KEY, JSON.stringify(results));
    window.dispatchEvent(new Event("sage-cart-updated"));
    setSyncing(false);
    setSynced(true);
  };

  useEffect(() => {
    syncCartWithDatabase();
    const handleCartUpdate = () => setItems(readCart());
    window.addEventListener("sage-cart-updated", handleCartUpdate);
    window.addEventListener("storage", handleCartUpdate);
    return () => {
      window.removeEventListener("sage-cart-updated", handleCartUpdate);
      window.removeEventListener("storage", handleCartUpdate);
    };
  }, []);

  // A coupon link (/cart?coupon=CODE) applies itself once the cart is ready.
  // With an empty cart the code is kept until a course is added.
  const urlCoupon = searchParams.get("coupon");
  const urlCouponHandled = useRef(false);

  useEffect(() => {
    if (!urlCoupon || !synced || urlCouponHandled.current) return;
    urlCouponHandled.current = true;

    if (items.length === 0) {
      coupon.stash(urlCoupon);
      toast.info(
        `Coupon ${urlCoupon.toUpperCase()} is saved. Add a course to use it.`,
      );
      return;
    }

    coupon.apply(urlCoupon).then((ok) => {
      if (ok) toast.success("Coupon applied.");
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCoupon, synced]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.unavailable
            ? 0
            : Number(item.price || 0) * Number(item.quantity || 1)),
        0,
      ),
    [items],
  );

  const originalTotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (item.unavailable
            ? 0
            : Number(item.originalPrice || item.price || 0) *
              Number(item.quantity || 1)),
        0,
      ),
    [items],
  );

  const savings = Math.max(originalTotal - subtotal, 0);

  // With a coupon, the server's figure is the total
  const couponDiscount = coupon.quote?.discount || 0;
  const payable = coupon.quote ? coupon.quote.total : subtotal;
  const totalSavings = savings + couponDiscount;

  const updateStorage = (next) => {
    setItems(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event("sage-cart-updated"));
  };

  // const changeQuantity = (id, amount) => {
  //   const next = items.map((item) => {
  //     if (item.id !== id) return item;
  //     const quantity = Math.max(1, Number(item.quantity || 1) + amount);
  //     return { ...item, quantity };
  //   });
  //   updateStorage(next);
  // };

  const removeItem = (id) =>
    updateStorage(items.filter((item) => item.id !== id));

  // Once prices and the student's courses are known, take out anything that
  // can't be bought: courses they already own, and free courses (those are
  // enrolled in directly from the course page).
  useEffect(() => {
    if (!synced || !enrollmentsReady || items.length === 0) return;

    const blocked = items.filter((item) => {
      if (item.unavailable) return false;
      const id = String(item.courseId || item.id);
      return enrolledIds.has(id) || Number(item.price || 0) <= 0;
    });

    if (blocked.length === 0) return;

    const blockedIds = new Set(blocked.map((item) => item.id));
    updateStorage(items.filter((item) => !blockedIds.has(item.id)));

    blocked.forEach((item) => {
      const owned = enrolledIds.has(String(item.courseId || item.id));

      toast.info(
        owned
          ? `You're already enrolled in "${item.title}", so it was removed from your cart.`
          : `"${item.title}" is free. Enroll from its course page. It was removed from your cart.`,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [synced, enrollmentsReady, items, enrolledIds]);

  const checkout = () => {
    if (!items.length) return;
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-surface text-heading">
      <Navbar />

      <section className="border-b border-line bg-linear-to-br from-slate-50 via-white to-red-50/60">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
          <div className="flex items-center gap-2 text-xs font-semibold text-body">
            <Link to="/courses" className="hover:text-primary cursor-pointer">
              Courses
            </Link>
            <ChevronRight size={14} />
            <span>Shopping Cart</span>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <ShoppingBag size={14} />
                Your learning cart
              </div>
              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Review your courses
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-body sm:text-base">
                Your selected courses are saved here. Review your order before
                moving to secure checkout.
              </p>
            </div>
            <Link
              to="/courses"
              className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold text-heading shadow-sm hover:border-primary hover:text-primary"
            >
              <ArrowLeft size={16} />
              Continue learning
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        {!items.length ? (
          <div className="rounded-3xl border border-dashed border-line bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
              <ShoppingBag size={30} />
            </div>
            <h2 className="mt-5 text-2xl font-bold">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-body">
              Discover a course that matches your goals and add it to your
              learning cart.
            </p>
            <Link
              to="/courses"
              className="mt-6 inline-flex items-center cursor-pointer gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
            >
              Explore courses <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold sm:text-xl">
                    {items.length} {items.length === 1 ? "course" : "courses"}{" "}
                    in your cart
                  </h2>
                  <p className="mt-1 text-sm text-body">Ready when you are.</p>
                </div>
                <span className="hidden items-center gap-1.5 text-xs font-semibold text-emerald-700 sm:flex">
                  <CheckCircle2 size={15} /> Secure checkout
                </span>
              </div>

              {syncing && (
                <div className="mb-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  Refreshing course details and prices from SAGE…
                </div>
              )}
              {syncError && (
                <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-5 text-amber-900">
                  One or more courses could not be verified with the server.
                  Remove unavailable courses or refresh the page before
                  checkout.
                </div>
              )}

              <div className="space-y-4">
                {items.map((item) => {
                  const quantity = Number(item.quantity || 1);
                  const listLine = Number(item.price || 0) * quantity;
                  const lineQuote = coupon.itemQuote(item.courseId || item.id);
                  const couponOff = Boolean(
                    lineQuote && lineQuote.discount > 0,
                  );
                  const compareAt = Number(item.originalPrice || 0) * quantity;

                  return (
                    <article
                      key={item.id}
                      className="rounded-2xl border border-line bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="h-44 w-full rounded-xl object-cover sm:h-28 sm:w-44"
                          />
                        ) : (
                          <div className="flex h-44 w-full items-center justify-center rounded-xl bg-slate-100 text-primary sm:h-28 sm:w-44">
                            <BookOpen size={30} />
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                                {item.category || "Course"}
                              </span>
                              {item.unavailable && (
                                <span className="ml-2 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-800">
                                  Unavailable
                                </span>
                              )}
                              <h3 className="mt-1 line-clamp-2 text-base font-bold leading-6 sm:text-lg">
                                {item.title}
                              </h3>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeItem(item.id)}
                              className="rounded-lg p-2 text-body cursor-pointer hover:bg-red-50 hover:text-red-600"
                              aria-label={`Remove ${item.title}`}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>

                          <p className="mt-1 text-sm text-body">
                            {item.instructor || "SAGE Instructor"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-body">
                            <span className="flex items-center gap-1.5">
                              <BookOpen size={14} /> Structured lessons
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Clock3 size={14} />{" "}
                              {item.duration || "Self-paced"}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Users size={14} /> Lifetime access
                            </span>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                            {/* <div className="flex items-center rounded-lg border border-line">
                              <button
                                type="button"
                                onClick={() => changeQuantity(item.id, -1)}
                                className="p-2.5 text-body hover:text-heading"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={15} />
                              </button>
                              <span className="min-w-8 text-center text-sm font-bold">
                                {item.quantity || 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => changeQuantity(item.id, 1)}
                                className="p-2.5 text-body hover:text-heading"
                                aria-label="Increase quantity"
                              >
                                <Plus size={15} />
                              </button>
                            </div> */}

                            <div>
                              <p className="text-lg font-bold text-heading">
                                {money(
                                  couponOff ? lineQuote.finalPrice : listLine,
                                )}
                              </p>

                              {couponOff ? (
                                <p className="text-xs text-body line-through">
                                  {money(listLine)}
                                </p>
                              ) : (
                                compareAt > listLine && (
                                  <p className="text-xs text-body line-through">
                                    {money(compareAt)}
                                  </p>
                                )
                              )}
                            </div>

                            {couponOff && (
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                <Tag size={12} />
                                Coupon applied
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lg shadow-gray-200/50">
                <div className="bg-secondary px-5 py-5 text-white sm:px-6">
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                    Order summary
                  </p>
                  <h2 className="mt-1 text-xl font-bold">
                    Complete your enrollment
                  </h2>
                  <p className="mt-1 text-xs text-blue-100">
                    Secure payment. Instant access after confirmation.
                  </p>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between gap-4 text-body">
                      <span>Course price</span>
                      <span className="font-semibold text-heading">
                        {money(originalTotal)}
                      </span>
                    </div>
                    <div className="flex justify-between gap-4 text-emerald-700">
                      <span className="flex items-center gap-2">
                        <Tag size={14} /> Course savings
                      </span>
                      <span className="font-semibold">-{money(savings)}</span>
                    </div>
                    {coupon.quote && (
                      <div className="flex justify-between gap-4 text-emerald-700">
                        <span className="flex min-w-0 items-center gap-2">
                          <Tag size={14} className="shrink-0" />
                          <span className="truncate">
                            Coupon ({coupon.quote.coupon.code})
                          </span>
                        </span>
                        <span className="font-semibold">
                          -{money(couponDiscount)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="my-5 border-t border-line" />

                  <CouponBox coupon={coupon} />

                  <div className="my-5 border-t border-line" />

                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-body">Total</p>
                      <p className="mt-1 text-2xl font-bold text-heading">
                        {coupon.loading ? "…" : money(payable)}
                      </p>
                    </div>
                    {totalSavings > 0 && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                        Save {money(totalSavings)}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={checkout}
                    className="mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-xl"
                  >
                    {syncing ? "Verifying courses…" : "Proceed to checkout"}
                    <ArrowRight size={17} />
                  </button>

                  <div className="mt-5 flex items-start gap-3 rounded-xl bg-surface-muted p-3">
                    <ShieldCheck
                      className="mt-0.5 shrink-0 text-emerald-600"
                      size={18}
                    />
                    <p className="text-xs leading-5 text-body">
                      Your payment is processed securely. We never store your
                      card details on SAGE.
                    </p>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <section className="border-y border-line bg-surface-muted">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {[
            [LockKeyhole, "Secure checkout", "Protected payment experience"],
            [
              BookOpen,
              "Learn at your pace",
              "Access your courses after enrollment",
            ],
            [
              ShieldCheck,
              "Trusted payments",
              "Powered by secure payment infrastructure",
            ],
          ].map(([Icon, title, text]) => (
            <div key={title} className="flex gap-3 rounded-2xl bg-white p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <Icon size={19} />
              </div>
              <div>
                <p className="text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-body">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
