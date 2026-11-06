import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  PlayCircle,
  ShieldCheck,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axiosClient from "../api/axiosClient";

// Where "Start learning" goes. This route must open the CoursePlayer for students.
const learnPath = (courseId) => `/dashboard/student/courses/${courseId}/learn`;

// How long the success screen waits before opening a single bought course.
const REDIRECT_SECONDS = 8;

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export default function PaymentResult() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const reference =
    searchParams.get("reference") || searchParams.get("trxref") || "";
  const [state, setState] = useState({
    status: "checking",
    message: "Verifying your payment with Paystack…",
    data: null,
  });

  const [autoRedirect, setAutoRedirect] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  const verify = useCallback(async () => {
    if (!reference) {
      setState({
        status: "failed",
        message:
          "No payment reference was returned. Your order has not been confirmed.",
        data: null,
      });
      return;
    }
    setState({
      status: "checking",
      message: "Verifying your payment with Paystack…",
      data: null,
    });
    try {
      const response = await axiosClient.get(
        `/payments/verify/${encodeURIComponent(reference)}`,
      );
      const payload = response?.data;
      const result = payload?.data || payload;
      if (payload?.status === "pending" || response?.status === 202) {
        setState({
          status: "pending",
          message:
            payload?.message || "Paystack is still processing your payment.",
          data: result,
        });
        return;
      }
      if (
        payload?.success &&
        (payload?.status === "paid" || result?.reference)
      ) {
        localStorage.removeItem("sage_cart");
        window.dispatchEvent(new Event("sage-cart-updated"));
        setState({
          status: "success",
          message: payload.message || "Payment verified successfully.",
          data: result,
        });
        return;
      }
      setState({
        status: "failed",
        message: payload?.message || "Paystack did not confirm this payment.",
        data: result,
      });
    } catch (error) {
      const payload = error?.response?.data;
      if (error?.response?.status === 202 || payload?.status === "pending") {
        setState({
          status: "pending",
          message:
            payload?.message ||
            "Payment is still processing. Please check again.",
          data: payload?.data || null,
        });
      } else if (error?.response?.status === 401) {
        setState({
          status: "failed",
          message:
            "Please log in to the account you paid with, then check this payment again.",
          data: null,
        });
      } else {
        setState({
          status: "failed",
          message:
            payload?.message ||
            "We could not verify this payment yet. Your cart has been kept so you can retry.",
          data: null,
        });
      }
    }
  }, [reference]);

  useEffect(() => {
    verify();
  }, [verify]);

  const isChecking = state.status === "checking";
  const isSuccess = state.status === "success";
  const isPending = state.status === "pending";

  const courses = state.data?.courses || [];
  const singleCourse = isSuccess && courses.length === 1 ? courses[0] : null;

  // One course bought: open it automatically after a short countdown.
  useEffect(() => {
    if (!singleCourse || !autoRedirect) return undefined;

    if (secondsLeft <= 0) {
      navigate(learnPath(singleCourse.courseId), { replace: true });
      return undefined;
    }

    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [singleCourse, autoRedirect, secondsLeft, navigate]);

  const Icon = isChecking
    ? LoaderCircle
    : isSuccess
      ? CheckCircle2
      : isPending
        ? Clock3
        : AlertCircle;
  const iconClass = isSuccess
    ? "bg-emerald-50 text-emerald-600"
    : isPending
      ? "bg-amber-50 text-amber-600"
      : isChecking
        ? "bg-blue-50 text-blue-600"
        : "bg-red-50 text-red-600";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-4 py-14 sm:px-6 lg:py-20">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div
            className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${iconClass}`}
          >
            <Icon size={30} className={isChecking ? "animate-spin" : ""} />
          </div>
          <p className="mt-6 text-center text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            SAGE LMS · Paystack test mode
          </p>
          <h1 className="mt-3 text-center text-2xl font-bold sm:text-3xl">
            {isChecking
              ? "Checking your payment"
              : isSuccess
                ? "Payment successful"
                : isPending
                  ? "Payment processing"
                  : "Payment not confirmed"}
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm leading-6 text-slate-600">
            {state.message}
          </p>

          {reference && (
            <div className="mt-7 rounded-xl bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Payment reference
              </p>
              <p className="mt-1 break-all font-mono text-sm font-semibold text-slate-800">
                {reference}
              </p>
            </div>
          )}

          {isSuccess && state.data && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-4">
                <span className="text-sm text-slate-600">Verified amount</span>
                <span className="font-bold">{money(state.data.amount)}</span>
              </div>
              {courses.length > 0 && (
                <div className="rounded-xl border border-slate-200 p-4">
                  <h2 className="flex items-center gap-2 font-bold">
                    <BookOpen size={17} /> Courses in this order
                  </h2>
                  <ul className="mt-3 space-y-2">
                    {courses.map((course) => (
                      <li
                        key={course.courseId}
                        className="flex items-center justify-between gap-3 text-sm text-slate-600"
                      >
                        <span className="min-w-0">{course.title}</span>

                        {/* With several courses, each one gets its own button */}
                        {courses.length > 1 && (
                          <Link
                            to={learnPath(course.courseId)}
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#B00000] px-3 py-2 text-xs font-bold text-white hover:bg-red-800"
                          >
                            <PlayCircle size={14} />
                            Start learning
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
                <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                <p>
                  Paystack verified the transaction on the server. The LMS has
                  recorded course access for{" "}
                  {state.data.customerEmail || "the checkout email"}.
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isSuccess ? (
              <>
                {singleCourse && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate(learnPath(singleCourse.courseId), {
                        replace: true,
                      })
                    }
                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-6 py-3 text-sm font-bold text-white hover:bg-red-800"
                  >
                    <PlayCircle size={18} />
                    Start learning
                  </button>
                )}
                <Link
                  to="/courses"
                  className={
                    singleCourse
                      ? "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                      : "inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-6 py-3 text-sm font-bold text-white hover:bg-red-800"
                  }
                >
                  Browse more courses
                </Link>
              </>
            ) : (
              <>
                {(isPending || isChecking) && (
                  <button
                    type="button"
                    onClick={verify}
                    disabled={isChecking}
                    className="rounded-xl bg-[#B00000] px-6 py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    Check payment again
                  </button>
                )}
                {state.status === "failed" && (
                  <Link
                    to="/checkout"
                    className="rounded-xl bg-[#B00000] px-6 py-3 text-center text-sm font-bold text-white hover:bg-red-800"
                  >
                    Return to checkout
                  </Link>
                )}
                <Link
                  to="/courses"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <ArrowLeft size={16} /> Back to courses
                </Link>
              </>
            )}
          </div>

          {singleCourse && autoRedirect && (
            <p className="mt-4 text-center text-xs text-slate-500">
              Taking you to your course in {secondsLeft}s.{" "}
              <button
                type="button"
                onClick={() => setAutoRedirect(false)}
                className="cursor-pointer font-bold text-[#B00000] hover:underline"
              >
                Stay on this page
              </button>
            </p>
          )}

          <p className="mt-6 text-center text-xs leading-5 text-slate-500">
            This page never treats the redirect alone as proof of payment. The
            server verifies the transaction directly with Paystack.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
