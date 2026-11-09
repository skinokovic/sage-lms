import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Tag,
  User,
  WalletCards,
  Copy,
  Loader2,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import CouponBox from "../components/CouponBox";
import axiosClient from "../api/axiosClient";
import useCoupon from "../hooks/useCoupon";
import { toast } from "react-toastify";
import { useSelector } from "react-redux";

const CART_KEY = "sage_cart";

// Change this one line if your register page uses a different path
// (your Login page links to "/create-account").
const REGISTER_PATH = "/register";

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const readCart = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

// Reads the student's details from the account, whichever field names it uses.
const getAccountName = (user) =>
  String(
    user?.name ||
      user?.fullName ||
      [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
      "",
  ).trim();
const getAccountEmail = (user) =>
  String(user?.email || "")
    .trim()
    .toLowerCase();
const getAccountPhone = (user) =>
  String(user?.phone || user?.phoneNumber || user?.mobile || "").trim();

const PAYMENT_METHODS = [
  {
    id: "card",
    title: "Pay online with Paystack",
    description: "Card payment: Visa, Mastercard & Verve",
    icon: CreditCard,
  },
  {
    id: "bank_transfer",
    title: "Bank transfer",
    description:
      "Transfer to our bank account. You're enrolled once we confirm it",
    icon: Banknote,
  },
];

// Local date as YYYY-MM-DD for <input type="date">
const todayInputValue = () => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
};

export default function Checkout() {
  const navigate = useNavigate();
  const { user, status: authStatus } = useSelector((state) => state.auth);
  const isStudent = user?.role === "student";
  const authChecking = authStatus === "checking";

  const accountName = isStudent ? getAccountName(user) : "";
  const accountEmail = isStudent ? getAccountEmail(user) : "";

  const [items, setItems] = useState(readCart);
  const [method, setMethod] = useState("card");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // The coupon applied in the cart (the server works out every price)
  const coupon = useCoupon(items);

  // Manual bank transfer
  const isBankTransfer = method === "bank_transfer";
  const [bankDetails, setBankDetails] = useState(null);
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankRetry, setBankRetry] = useState(0);
  const [transfer, setTransfer] = useState({
    senderName: "",
    transferReference: "",
    transferDate: todayInputValue(),
    note: "",
  });
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const syncCartWithDatabase = async () => {
    const stored = readCart();
    if (!stored.length) {
      setSyncError(false);
      return;
    }
    setSyncing(true);
    setSyncError(false);
    const refreshed = await Promise.all(
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
            instructor:
              typeof course.instructor === "string"
                ? course.instructor
                : course.instructor?.name ||
                  course.instructorName ||
                  item.instructor ||
                  "SAGE Instructor",
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
    const hasUnavailable = refreshed.some((item) => item.unavailable);
    localStorage.setItem(CART_KEY, JSON.stringify(refreshed));
    setItems(refreshed);
    setSyncError(hasUnavailable);
    setSyncing(false);
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

  // When a student is logged in, fill the form from their account.
  useEffect(() => {
    if (!isStudent) return;
    setForm((current) => ({
      name: getAccountName(user) || current.name,
      email: getAccountEmail(user) || current.email,
      phone: current.phone || getAccountPhone(user),
    }));
  }, [isStudent, user]);

  // Suggest the student's own name as the sender of the transfer.
  useEffect(() => {
    if (!accountName) return;
    setTransfer((current) => ({
      ...current,
      senderName: current.senderName || accountName,
    }));
  }, [accountName]);

  // Load the school's bank details the first time bank transfer is chosen.
  useEffect(() => {
    if (!isBankTransfer || !isStudent || bankDetails) return undefined;

    let cancelled = false;
    setBankLoading(true);
    setBankError("");

    axiosClient
      .get("/payments/bank-transfer/details")
      .then(({ data }) => {
        if (!cancelled) setBankDetails(data.details);
      })
      .catch((error) => {
        if (!cancelled) {
          setBankError(
            error?.response?.data?.message ||
              "Couldn't load our bank details. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setBankLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isBankTransfer, isStudent, bankDetails, bankRetry]);

  const total = items.reduce(
    (sum, item) =>
      sum +
      (item.unavailable
        ? 0
        : Number(item.price || 0) * Number(item.quantity || 1)),
    0,
  );

  // With a coupon, the server's figure is what the student pays. A coupon that
  // covers the whole price means no payment step at all.
  const couponDiscount = coupon.quote?.discount || 0;
  const payable = coupon.quote ? coupon.quote.total : total;
  const isFree = Boolean(coupon.quote) && payable === 0;
  const couponCode = coupon.quote?.coupon?.code || "";

  const update = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateTransfer = (field, value) =>
    setTransfer((current) => ({ ...current, [field]: value }));

  const emptyCart = () => {
    localStorage.setItem(CART_KEY, "[]");
    setItems([]);
    window.dispatchEvent(new Event("sage-cart-updated"));
  };

  const handleSubmit = async (event) => {
    event?.preventDefault?.();
    if (submitting || syncing || authChecking || coupon.loading) return;
    if (!isStudent) {
      toast.error("Login as a student to pay, or create a student account.");
      return;
    }
    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error(
        "Please complete your name, email address, and phone number.",
      );
      return;
    }
    if (form.phone.trim().length < 7) {
      toast.error("Enter a valid phone number.");
      return;
    }
    if (!items.length) {
      toast.error("Your cart is empty. Add a course before checkout.");
      return;
    }
    if (syncError || items.some((item) => item.unavailable)) {
      toast.error(
        "Please remove unavailable courses and verify your cart before paying.",
      );
      return;
    }

    // Manual bank transfer: the student says they have paid, and an admin
    // confirms it before enrolling them. Nothing is charged here.
    if (isBankTransfer && !isFree) {
      if (!bankDetails?.configured) {
        toast.error(
          "Bank transfer isn't available right now. Please pay with Paystack.",
        );
        return;
      }
      if (!transfer.senderName.trim()) {
        toast.error("Enter the account name you sent the money from.");
        return;
      }
      if (!transfer.transferDate) {
        toast.error("Enter the date you made the transfer.");
        return;
      }

      setSubmitting(true);
      try {
        const { data } = await axiosClient.post("/payments/bank-transfer", {
          phone: form.phone.trim(),
          senderName: transfer.senderName.trim(),
          transferReference: transfer.transferReference.trim(),
          transferDate: transfer.transferDate,
          note: transfer.note.trim(),
          couponCode: couponCode || undefined,
          items: items.map((item) => ({
            courseId: item.courseId || item.id || item._id,
          })),
        });

        setSubmittedRequest(data.request);

        // The courses now wait for confirmation, so empty the cart.
        emptyCart();
        coupon.remove();
      } catch (error) {
        const status = error?.response?.status;
        toast.error(
          status === 401 || status === 403
            ? "Login as a student to pay, or create a student account."
            : error?.response?.data?.message ||
                "Couldn't submit your transfer. Please try again.",
        );
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // The backend recalculates every course price and the coupon discount;
    // never send/trust the browser total.
    setSubmitting(true);
    try {
      const response = await axiosClient.post("/payments/initialize", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        method,
        couponCode: couponCode || undefined,
        items: items.map((item) => ({
          courseId: item.courseId || item.id || item._id,
        })),
      });
      const payload = response?.data;
      const payment = payload?.data || payload;

      // A coupon covered the whole price: the server has already enrolled the
      // student, so go to the normal confirmation page.
      if (payment?.free) {
        emptyCart();
        coupon.remove();
        const ref = encodeURIComponent(payment.reference);
        navigate(`/payment/verify?reference=${ref}&trxref=${ref}`);
        return;
      }

      if (!payment?.authorizationUrl) {
        throw new Error(
          payload?.message ||
            "The payment checkout link was not returned by the server.",
        );
      }
      // Paystack handles the card/bank form on its hosted checkout page.
      window.location.assign(payment.authorizationUrl);
    } catch (error) {
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        // 401 = not logged in, 403 = logged in with a non-student role
        toast.error("Login as a student to pay, or create a student account.");
        setSubmitting(false);
        return;
      }
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Could not start the Paystack test payment. Please try again.";
      toast.error(message);
      setSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl border border-line bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={32} />
            </div>

            <h1 className="mt-5 text-2xl font-bold">Transfer submitted</h1>
            <p className="mt-2 text-sm leading-6 text-body">
              Thank you. Our team will confirm your transfer and enroll you in
              your course
              {submittedRequest.courses.length === 1 ? "" : "s"}. They will
              appear in your dashboard once it is confirmed.
            </p>

            <div className="mt-6 rounded-2xl border border-line bg-surface-muted p-5 text-left text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-body">Reference</span>
                <span className="font-bold">{submittedRequest.reference}</span>
              </div>
              {submittedRequest.couponCode && (
                <div className="mt-3 flex justify-between gap-4">
                  <span className="text-body">Coupon</span>
                  <span className="font-bold text-emerald-700">
                    {submittedRequest.couponCode} (-
                    {money(submittedRequest.discount)})
                  </span>
                </div>
              )}
              <div className="mt-3 flex justify-between gap-4">
                <span className="text-body">Amount</span>
                <span className="font-bold">
                  {money(submittedRequest.amount)}
                </span>
              </div>
              <div className="mt-3 border-t border-line pt-3">
                <p className="text-xs font-semibold text-body">Courses</p>
                <ul className="mt-2 space-y-1">
                  {submittedRequest.courses.map((course) => (
                    <li key={course.courseId} className="font-semibold">
                      {course.title}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 text-xs text-body">
              Keep your reference. Quote it if you contact us about this
              payment.
            </p>

            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/dashboard/student"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
              >
                Go to my dashboard <ArrowRight size={16} />
              </Link>
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-6 py-3 text-sm font-bold hover:border-primary hover:text-primary"
              >
                Browse more courses
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8 text-primary">
            <WalletCards size={30} />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Your checkout is empty</h1>
          <p className="mt-2 text-sm leading-6 text-body">
            Add a course to your cart before proceeding to checkout.
          </p>
          <Link
            to="/courses"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90"
          >
            Explore courses <ArrowRight size={16} />
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const payDisabled =
    syncing ||
    submitting ||
    authChecking ||
    syncError ||
    coupon.loading ||
    items.some((item) => item.unavailable) ||
    (isBankTransfer && !isFree && (bankLoading || !bankDetails?.configured));

  const payLabel = isFree
    ? "Enroll for free"
    : isBankTransfer
      ? "I've made the transfer"
      : `Pay ${money(payable)}`;
  const busyLabel = isFree
    ? "Enrolling…"
    : isBankTransfer
      ? "Submitting…"
      : "Preparing…";

  return (
    <div className="min-h-screen bg-[#f8fafc] text-heading">
      <Navbar />

      {/* Header */}
      <section className="border-b border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
          <div className="flex items-center gap-2 text-xs font-semibold text-body">
            <Link to="/cart" className="hover:text-primary">
              Cart
            </Link>
            <ChevronRight size={14} />
            <span>Checkout</span>
          </div>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <LockKeyhole size={13} />
                Secure checkout
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                Complete your enrollment
              </h1>
              <p className="mt-1 text-sm text-body sm:text-base">
                Confirm your details and choose your preferred payment method.
              </p>
            </div>

            <Link
              to="/cart"
              className="hidden items-center cursor-pointer gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold hover:border-primary hover:text-primary sm:inline-flex"
            >
              <ArrowLeft size={16} />
              Back to cart
            </Link>
          </div>
        </div>
      </section>

      {/* Progress */}
      <div className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-4 sm:px-6">
          {[
            ["01", "Cart", true],
            ["02", "Checkout", true],
            ["03", "Confirmation", false],
          ].map(([number, label, active], index) => (
            <div key={number} className="flex flex-1 items-center">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                    active
                      ? "bg-primary text-white"
                      : "border border-line bg-white text-body"
                  }`}
                >
                  {active && number !== "02" ? <Check size={14} /> : number}
                </div>
                <span
                  className={`hidden text-xs font-bold sm:block ${
                    active ? "text-heading" : "text-body"
                  }`}
                >
                  {label}
                </span>
              </div>

              {index < 2 && (
                <div className="mx-3 h-px flex-1 bg-line sm:mx-5" />
              )}
            </div>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[1fr_390px]">
          {/* Left */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student-only notice (logged out, or logged in as instructor/admin) */}
            {!isStudent && !authChecking && (
              <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 sm:p-7">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800">
                    <LockKeyhole size={19} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">
                      Student account required
                    </h2>
                    <p className="mt-1 text-sm text-body">
                      {user ? `You're logged in as an ${user.role}. ` : ""}
                      Login as a student to pay, or create a student account.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        to="/login"
                        state={{ from: "/checkout" }}
                        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
                      >
                        Login
                      </Link>
                      <Link
                        to={REGISTER_PATH}
                        state={{ from: "/checkout" }}
                        className="rounded-xl border border-line bg-white px-5 py-2.5 text-sm font-bold hover:border-primary hover:text-primary"
                      >
                        Create account
                      </Link>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Customer details */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/8 text-primary">
                  <User size={19} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Your details</h2>
                  <p className="mt-1 text-sm text-body">
                    {isStudent
                      ? "These come from your student account. Add a phone number to continue."
                      : "We'll use these details to create and confirm your enrollment."}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="sm:col-span-2">
                  <span className="mb-2 block text-sm font-semibold">
                    Full name
                  </span>
                  <div className="relative">
                    <User
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body"
                      size={17}
                    />
                    <input
                      required
                      value={form.name}
                      readOnly={Boolean(accountName)}
                      disabled={!isStudent}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 read-only:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Email address
                  </span>
                  <div className="relative">
                    <Mail
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body"
                      size={17}
                    />
                    <input
                      required
                      type="email"
                      value={form.email}
                      readOnly={Boolean(accountEmail)}
                      disabled={!isStudent}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 read-only:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>

                <label>
                  <span className="mb-2 block text-sm font-semibold">
                    Phone number
                  </span>
                  <div className="relative">
                    <Phone
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-body"
                      size={17}
                    />
                    <input
                      required
                      type="tel"
                      value={form.phone}
                      disabled={!isStudent}
                      onChange={(e) => update("phone", e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full rounded-xl border border-line bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                  </div>
                </label>
              </div>
            </section>

            {/* Payment */}
            <section className="rounded-3xl border border-line bg-white p-5 shadow-sm sm:p-7">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/8 text-secondary">
                  <WalletCards size={19} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">
                    {isFree ? "Payment" : "Choose payment method"}
                  </h2>
                  <p className="mt-1 text-sm text-body">
                    {isFree
                      ? "Your coupon covers the full price."
                      : "Select how you'd like to pay for your enrollment."}
                  </p>
                </div>
              </div>

              {isFree ? (
                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                  <CheckCircle2
                    size={22}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <div>
                    <p className="text-sm font-bold text-emerald-900">
                      No payment needed
                    </p>
                    <p className="mt-1 text-xs leading-5 text-emerald-800">
                      Coupon {couponCode} takes {money(couponDiscount)} off, so
                      your total is {money(0)}. Click “Enroll for free” to start
                      learning right away.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-6 space-y-3">
                    {PAYMENT_METHODS.map((item) => {
                      const Icon = item.icon;
                      const selected = method === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setMethod(item.id)}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all ${
                            selected
                              ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                              : "border-line hover:border-primary/30 hover:bg-surface-muted"
                          }`}
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                              selected
                                ? "bg-primary text-white"
                                : "bg-surface-muted text-heading"
                            }`}
                          >
                            <Icon size={20} />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-bold">{item.title}</p>
                              {item.id === "card" && (
                                <span className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-bold text-primary">
                                  Recommended
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs text-body">
                              {item.description}
                            </p>
                          </div>

                          <div
                            className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? "border-primary bg-primary text-white"
                                : "border-gray-300"
                            }`}
                          >
                            {selected && <Check size={12} strokeWidth={3} />}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {isBankTransfer ? (
                    <BankTransferPanel
                      details={bankDetails}
                      loading={bankLoading}
                      error={bankError}
                      onRetry={() => setBankRetry((count) => count + 1)}
                      total={payable}
                      disabled={!isStudent}
                      transfer={transfer}
                      onChange={updateTransfer}
                    />
                  ) : (
                    <div className="mt-5 rounded-2xl border border-line bg-surface-muted p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-body">
                            Payments secured by
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-lg font-extrabold tracking-tight text-[#00c3f7]">
                              paystack
                            </span>
                            <span className="text-xs text-body">
                              Secure payment gateway
                            </span>
                          </div>
                        </div>
                        <ShieldCheck className="text-emerald-600" size={27} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Mobile action */}
            <button
              type="submit"
              disabled={payDisabled}
              className="flex w-full items-center cursor-pointer justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 lg:hidden"
            >
              {submitting ? busyLabel : payLabel}
              <ArrowRight size={17} />
            </button>

            <p className="flex items-center justify-center gap-2 text-center text-xs text-body lg:hidden">
              <LockKeyhole size={13} />
              {isFree
                ? "No payment needed with your coupon"
                : isBankTransfer
                  ? "You're enrolled once we confirm your transfer"
                  : "Secure payment · Your card details are protected"}
            </p>
          </form>

          {/* Right summary */}
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <div className="overflow-hidden rounded-3xl border border-line bg-white shadow-lg shadow-gray-200/50">
              <div className="bg-secondary px-5 py-5 text-white sm:px-6">
                <p className="text-xs font-bold uppercase tracking-wider text-blue-200">
                  Enrollment summary
                </p>
                <h2 className="mt-1 text-xl font-bold">Your courses</h2>
              </div>

              <div className="max-h-[380px] space-y-4 overflow-y-auto p-5 sm:p-6">
                {items.map((item) => {
                  const line =
                    Number(item.price || 0) * Number(item.quantity || 1);
                  const lineQuote = coupon.itemQuote(item.courseId || item.id);
                  const couponOff = Boolean(
                    lineQuote && lineQuote.discount > 0,
                  );

                  return (
                    <div key={item.id} className="flex gap-3">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.title}
                          className="h-16 w-24 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-primary">
                          <BookOpen size={22} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="line-clamp-2 text-sm font-bold leading-5">
                          {item.title}
                        </p>
                        {item.unavailable && (
                          <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                            Unavailable
                          </span>
                        )}
                        <p className="mt-1 text-xs text-body">
                          Qty: {item.quantity || 1}
                        </p>
                        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 text-sm font-bold text-primary">
                          {money(couponOff ? lineQuote.finalPrice : line)}
                          {couponOff && (
                            <span className="text-xs font-normal text-body line-through">
                              {money(line)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-line p-5 sm:p-6">
                <CouponBox coupon={coupon} />

                <div className="my-5 border-t border-line" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between gap-4 text-body">
                    <span>Subtotal</span>
                    <span className="font-semibold text-heading">
                      {money(total)}
                    </span>
                  </div>
                  {coupon.quote && (
                    <div className="flex justify-between gap-4 text-emerald-700">
                      <span className="flex min-w-0 items-center gap-2">
                        <Tag size={14} className="shrink-0" />
                        <span className="truncate">Coupon ({couponCode})</span>
                      </span>
                      <span className="font-semibold">
                        -{money(couponDiscount)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between gap-4 text-body">
                    <span>Processing</span>
                    <span className="font-semibold text-emerald-700">
                      Included
                    </span>
                  </div>
                </div>

                <div className="my-5 border-t border-line" />

                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs text-body">Total to pay</p>
                    <p className="mt-1 text-2xl font-bold">
                      {coupon.loading ? "…" : money(payable)}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                    Secure
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={payDisabled}
                  className="mt-5 hidden w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 lg:flex"
                >
                  {submitting ? busyLabel : payLabel}
                  <ArrowRight size={17} />
                </button>

                <div className="mt-5 space-y-3 text-xs text-body">
                  <div className="flex gap-2">
                    <ShieldCheck
                      className="shrink-0 text-emerald-600"
                      size={16}
                    />
                    <span>
                      {isFree
                        ? "Covered in full by your coupon"
                        : isBankTransfer
                          ? "Bank transfer · confirmed by our team"
                          : "Paystack secure checkout"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <BookOpen className="shrink-0 text-primary" size={16} />
                    <span>Course access after successful enrollment</span>
                  </div>
                  <div className="flex gap-2">
                    <MapPin className="shrink-0 text-secondary" size={16} />
                    <span>Prices displayed in Nigerian Naira</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-48 w-48 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary">
                  <Logo variant="light" size={34} />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-heading">
                    SAGE Learning
                  </p>

                  <p className="mt-0.5 text-xs text-body">Learn. Grow. Lead.</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <section className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6">
          {[
            [
              "Secure",
              "Your payment details are handled through a secure gateway.",
            ],
            ["Fast", "Complete your enrollment in just a few simple steps."],
            ["Ready to learn", "Access your course after successful payment."],
          ].map(([title, text]) => (
            <div
              key={title}
              className="flex gap-3 rounded-2xl bg-surface-muted p-4"
            >
              <CheckCircle2
                className="mt-0.5 shrink-0 text-emerald-600"
                size={19}
              />
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

/* ============================================================
   BANK TRANSFER PANEL
============================================================ */

const FIELD_CLASS =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-60";

const copyText = async (value, label) => {
  try {
    await navigator.clipboard.writeText(String(value));
    toast.success(`${label} copied.`);
  } catch {
    toast.error("Couldn't copy. Please copy it manually.");
  }
};

function BankTransferPanel({
  details,
  loading,
  error,
  onRetry,
  total,
  disabled,
  transfer,
  onChange,
}) {
  if (loading) {
    return (
      <div className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-line bg-surface-muted p-6 text-sm text-body">
        <Loader2 size={17} className="animate-spin" />
        Loading our bank details…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-5 text-sm text-red-700">
        <p>{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 font-bold underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!details) return null;

  if (!details.configured) {
    return (
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        Bank transfer isn't available right now. Please pay online with Paystack
        instead.
      </div>
    );
  }

  const rows = [
    ["Bank name", details.bankName, false],
    ["Account name", details.accountName, false],
    ["Account number", details.accountNumber, true],
  ];

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-2xl border border-line bg-surface-muted p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-body">
          Transfer to this account
        </p>

        <div className="mt-4 space-y-3">
          {rows.map(([label, value, copyable]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-body">{label}</span>

              <span className="flex items-center gap-2 text-right font-bold">
                {value}
                {copyable && (
                  <button
                    type="button"
                    onClick={() => copyText(value, label)}
                    className="rounded-lg p-1.5 text-body hover:bg-white hover:text-primary"
                    aria-label={`Copy ${label.toLowerCase()}`}
                  >
                    <Copy size={15} />
                  </button>
                )}
              </span>
            </div>
          ))}

          <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-sm">
            <span className="text-body">Amount to transfer</span>
            <span className="text-base font-extrabold text-primary">
              {money(total)}
            </span>
          </div>
        </div>

        <ol className="mt-4 list-decimal space-y-1 pl-5 text-xs leading-5 text-body">
          <li>Transfer exactly {money(total)} to the account above.</li>
          <li>Use your full name as the transfer narration.</li>
          <li>Fill in your transfer details below, then submit.</li>
        </ol>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">
            Account name you sent from
          </span>
          <input
            value={transfer.senderName}
            disabled={disabled}
            onChange={(event) => onChange("senderName", event.target.value)}
            placeholder="Name on the account that made the transfer"
            className={FIELD_CLASS}
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">
            Date of transfer
          </span>
          <input
            type="date"
            value={transfer.transferDate}
            max={todayInputValue()}
            disabled={disabled}
            onChange={(event) => onChange("transferDate", event.target.value)}
            className={FIELD_CLASS}
          />
        </label>

        <label>
          <span className="mb-2 block text-sm font-semibold">
            Transfer reference{" "}
            <span className="font-normal text-body">(optional)</span>
          </span>
          <input
            value={transfer.transferReference}
            maxLength={100}
            disabled={disabled}
            onChange={(event) =>
              onChange("transferReference", event.target.value)
            }
            placeholder="Reference or session ID from your bank"
            className={FIELD_CLASS}
          />
        </label>

        <label className="sm:col-span-2">
          <span className="mb-2 block text-sm font-semibold">
            Note <span className="font-normal text-body">(optional)</span>
          </span>
          <textarea
            rows={2}
            value={transfer.note}
            maxLength={500}
            disabled={disabled}
            onChange={(event) => onChange("note", event.target.value)}
            placeholder="Anything we should know about this payment"
            className={`${FIELD_CLASS} resize-none`}
          />
        </label>
      </div>
    </div>
  );
}
