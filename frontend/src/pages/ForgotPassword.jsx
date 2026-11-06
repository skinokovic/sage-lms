import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Mail,
  ShieldCheck,
  Loader2,
} from "lucide-react";
import { toast } from "react-toastify";

import Logo from "../components/Logo";
import { authApi } from "../api/authApi";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const isLoading = status === "loading";
  const isSuccess = status === "success";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError("Please enter your email address.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    try {
      setStatus("loading");

      const { data } = await authApi.forgotPassword(normalizedEmail);

      setStatus("success");

      toast.success(
        data?.message ||
          "If an account exists with that email, a reset link has been sent.",
      );
    } catch (err) {
      setStatus("idle");

      const message =
        err.response?.data?.message ||
        "We couldn't process your request. Please try again.";

      setError(message);
      toast.error(message);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" className="transition-opacity hover:opacity-80">
            <Logo size={38} />
          </Link>
        </div>
      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-md">
          {/* =====================================================
              CARD
          ===================================================== */}
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50">
            {/* Top accent */}
            <div className="h-1 bg-primary" />

            <div className="px-6 py-8 sm:px-10 sm:py-10">
              {!isSuccess ? (
                <>
                  {/* =================================================
                      ICON
                  ================================================= */}
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary">
                      <Mail size={30} strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* =================================================
                      HEADING
                  ================================================= */}
                  <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      Forgot your password?
                    </h1>

                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                      No worries. Enter the email address associated with your
                      SAGE account and we'll send you a link to reset your
                      password.
                    </p>
                  </div>

                  {/* =================================================
                      FORM
                  ================================================= */}
                  <form
                    onSubmit={handleSubmit}
                    className="mt-8 space-y-5"
                    noValidate
                  >
                    <div>
                      <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Email address
                      </label>

                      <div className="relative">
                        <Mail
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            if (error) setError("");
                          }}
                          placeholder="you@example.com"
                          disabled={isLoading}
                          className={`
                            h-12 w-full rounded-xl border
                            bg-white pl-10 pr-4 text-sm text-gray-900
                            outline-none transition
                            placeholder:text-gray-400
                            focus:ring-4
                            ${
                              error
                                ? "border-red-400 focus:border-red-500 focus:ring-red-50"
                                : "border-gray-200 focus:border-primary focus:ring-red-50"
                            }
                            disabled:cursor-not-allowed
                            disabled:bg-gray-50
                          `}
                        />
                      </div>

                      {error && (
                        <p className="mt-2 text-xs font-medium text-red-600">
                          {error}
                        </p>
                      )}
                    </div>

                    {/* =================================================
                        SUBMIT
                    ================================================= */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="
                        flex h-12 w-full items-center
                        justify-center gap-2 rounded-xl
                        bg-primary px-4 text-sm font-semibold
                        text-white shadow-sm
                        transition
                        hover:bg-red-800
                        focus:outline-none
                        focus:ring-4 focus:ring-red-100
                        disabled:cursor-not-allowed
                        disabled:opacity-70
                      "
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        <>
                          Send Reset Link
                          <ArrowLeft size={17} className="rotate-180" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* =================================================
                      SECURITY NOTE
                  ================================================= */}
                  <div className="mt-7 flex gap-3 rounded-xl bg-gray-50 p-4">
                    <ShieldCheck
                      size={19}
                      className="mt-0.5 shrink-0 text-secondary"
                    />

                    <p className="text-xs leading-5 text-gray-500">
                      For your security, we won't reveal whether an account
                      exists with the email address you entered.
                    </p>
                  </div>

                  {/* =================================================
                      BACK TO LOGIN
                  ================================================= */}
                  <div className="mt-7 text-center">
                    <Link
                      to="/login"
                      className="
                        inline-flex items-center gap-2
                        text-sm font-semibold text-secondary
                        transition hover:text-blue-800
                      "
                    >
                      <ArrowLeft size={16} />
                      Back to sign in
                    </Link>
                  </div>
                </>
              ) : (
                /* ===================================================
                   SUCCESS STATE
                =================================================== */
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <CheckCircle2 size={34} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Check your email
                  </h1>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                    If an account is associated with{" "}
                    <span className="font-semibold text-gray-700">
                      {email.trim()}
                    </span>
                    , we've sent instructions for resetting your password.
                  </p>

                  {/* Email reminder */}
                  <div className="mt-7 rounded-xl bg-blue-50 p-4 text-left">
                    <div className="flex gap-3">
                      <Mail
                        size={20}
                        className="mt-0.5 shrink-0 text-secondary"
                      />

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Didn't receive the email?
                        </p>

                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          Check your spam or junk folder. The reset link may
                          take a few moments to arrive.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Link
                    to="/login"
                    className="
                      mt-7 flex h-12 w-full items-center
                      justify-center gap-2 rounded-xl
                      border border-gray-200 bg-white
                      text-sm font-semibold text-gray-700
                      transition
                      hover:border-gray-300 hover:bg-gray-50
                    "
                  >
                    <ArrowLeft size={17} />
                    Back to Sign In
                  </Link>

                  {/* Try another email */}
                  <button
                    type="button"
                    onClick={() => {
                      setStatus("idle");
                      setEmail("");
                      setError("");
                    }}
                    className="
                      mt-4 text-sm font-medium
                      text-secondary hover:text-blue-800
                    "
                  >
                    Try another email address
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* =======================================================
              FOOTER
          ======================================================= */}
          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} SAGE LMS. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
};

export default ForgotPassword;
