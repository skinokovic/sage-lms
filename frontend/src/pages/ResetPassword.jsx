import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";

import Logo from "../components/Logo";
import { authApi } from "../api/authApi";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [status, setStatus] = useState(token ? "idle" : "invalid");

  const [error, setError] = useState("");

  const isLoading = status === "loading";
  const isSuccess = status === "success";
  const isInvalid = status === "invalid";

  /*
   * ============================================================
   * PASSWORD REQUIREMENTS
   * ============================================================
   */

  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordValid =
    passwordRequirements.minLength &&
    passwordRequirements.hasUppercase &&
    passwordRequirements.hasLowercase &&
    passwordRequirements.hasNumber;

  const passwordsMatch =
    password.length > 0 &&
    confirmPassword.length > 0 &&
    password === confirmPassword;

  /*
   * ============================================================
   * HANDLE SUBMIT
   * ============================================================
   */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");

    if (!token) {
      setStatus("invalid");
      return;
    }

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (!isPasswordValid) {
      setError(
        "Your password does not meet the required security requirements.",
      );
      return;
    }

    if (!confirmPassword) {
      setError("Please confirm your new password.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }

    try {
      setStatus("loading");

      await authApi.resetPassword(token, password);

      setStatus("success");

      toast.success("Your password has been reset successfully.");
    } catch (err) {
      console.error("Password reset error:", err);

      const message =
        err.response?.data?.message ||
        "This password reset link is invalid or has expired.";

      setError(message);
      setStatus("idle");

      toast.error(message);
    }
  };

  /*
   * ============================================================
   * PASSWORD REQUIREMENT ITEM
   * ============================================================
   */

  const Requirement = ({ valid, children }) => {
    return (
      <div className="flex items-center gap-2">
        {valid ? (
          <CheckCircle2 size={15} className="shrink-0 text-green-600" />
        ) : (
          <XCircle size={15} className="shrink-0 text-gray-300" />
        )}

        <span className={valid ? "text-green-700" : "text-gray-500"}>
          {children}
        </span>
      </div>
    );
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
              {/* =================================================
                  INVALID TOKEN
              ================================================= */}
              {isInvalid ? (
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-primary">
                      <XCircle size={34} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Invalid reset link
                  </h1>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                    This password reset link is missing or invalid. Please
                    request a new password reset link.
                  </p>

                  <Link
                    to="/forgot-password"
                    className="
                      mt-7 flex h-12 w-full items-center
                      justify-center gap-2 rounded-xl
                      bg-primary px-4 text-sm font-semibold
                      text-white transition
                      hover:bg-red-800
                      focus:outline-none
                      focus:ring-4 focus:ring-red-100
                    "
                  >
                    Request New Reset Link
                  </Link>

                  <Link
                    to="/login"
                    className="
                      mt-5 inline-flex items-center gap-2
                      text-sm font-semibold text-secondary
                      transition hover:text-blue-800
                    "
                  >
                    <ArrowLeft size={16} />
                    Back to sign in
                  </Link>
                </div>
              ) : isSuccess ? (
                /* =================================================
                   SUCCESS STATE
                ================================================= */
                <div className="text-center">
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                      <CheckCircle2 size={34} strokeWidth={1.8} />
                    </div>
                  </div>

                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Password reset successful
                  </h1>

                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                    Your password has been changed successfully. You can now
                    sign in to your SAGE LMS account using your new password.
                  </p>

                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="
                      mt-7 flex h-12 w-full items-center
                      justify-center gap-2 rounded-xl
                      bg-primary px-4 text-sm font-semibold
                      text-white transition
                      hover:bg-red-800
                      focus:outline-none
                      focus:ring-4 focus:ring-red-100
                    "
                  >
                    Continue to Sign In
                    <ArrowLeft size={17} className="rotate-180" />
                  </button>
                </div>
              ) : (
                /* =================================================
                   RESET FORM
                ================================================= */
                <>
                  {/* =================================================
                      ICON
                  ================================================= */}
                  <div className="mb-6 flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-primary">
                      <KeyRound size={30} strokeWidth={1.8} />
                    </div>
                  </div>

                  {/* =================================================
                      HEADING
                  ================================================= */}
                  <div className="text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                      Create a new password
                    </h1>

                    <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-gray-500">
                      Choose a strong password for your SAGE LMS account. You'll
                      use this password the next time you sign in.
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
                    {/* =================================================
                        NEW PASSWORD
                    ================================================= */}
                    <div>
                      <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        New password
                      </label>

                      <div className="relative">
                        <KeyRound
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={password}
                          onChange={(event) => {
                            setPassword(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Enter your new password"
                          disabled={isLoading}
                          className="
                            h-12 w-full rounded-xl
                            border border-gray-200
                            bg-white pl-10 pr-12
                            text-sm text-gray-900
                            outline-none transition
                            placeholder:text-gray-400
                            focus:border-primary
                            focus:ring-4
                            focus:ring-red-50
                            disabled:cursor-not-allowed
                            disabled:bg-gray-50
                          "
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((previous) => !previous)
                          }
                          disabled={isLoading}
                          className="
                            absolute right-3 top-1/2
                            -translate-y-1/2
                            rounded-lg p-1.5
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-600
                          "
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* =================================================
                        PASSWORD REQUIREMENTS
                    ================================================= */}
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-gray-600">
                        Password requirements
                      </p>

                      <div className="grid gap-2 text-xs sm:grid-cols-2">
                        <Requirement valid={passwordRequirements.minLength}>
                          At least 8 characters
                        </Requirement>

                        <Requirement valid={passwordRequirements.hasUppercase}>
                          One uppercase letter
                        </Requirement>

                        <Requirement valid={passwordRequirements.hasLowercase}>
                          One lowercase letter
                        </Requirement>

                        <Requirement valid={passwordRequirements.hasNumber}>
                          One number
                        </Requirement>
                      </div>
                    </div>

                    {/* =================================================
                        CONFIRM PASSWORD
                    ================================================= */}
                    <div>
                      <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Confirm password
                      </label>

                      <div className="relative">
                        <KeyRound
                          size={18}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />

                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          autoComplete="new-password"
                          value={confirmPassword}
                          onChange={(event) => {
                            setConfirmPassword(event.target.value);

                            if (error) {
                              setError("");
                            }
                          }}
                          placeholder="Confirm your new password"
                          disabled={isLoading}
                          className={`
                            h-12 w-full rounded-xl border
                            bg-white pl-10 pr-12
                            text-sm text-gray-900
                            outline-none transition
                            placeholder:text-gray-400
                            focus:ring-4
                            disabled:cursor-not-allowed
                            disabled:bg-gray-50
                            ${
                              confirmPassword && password === confirmPassword
                                ? "border-green-400 focus:border-green-500 focus:ring-green-50"
                                : "border-gray-200 focus:border-primary focus:ring-red-50"
                            }
                          `}
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword((previous) => !previous)
                          }
                          disabled={isLoading}
                          className="
                            absolute right-3 top-1/2
                            -translate-y-1/2
                            rounded-lg p-1.5
                            text-gray-400
                            transition
                            hover:bg-gray-100
                            hover:text-gray-600
                          "
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirmed password"
                              : "Show confirmed password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      {confirmPassword && (
                        <div className="mt-2">
                          {passwordsMatch ? (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-green-600">
                              <CheckCircle2 size={14} />
                              Passwords match
                            </p>
                          ) : (
                            <p className="flex items-center gap-1.5 text-xs font-medium text-red-600">
                              <XCircle size={14} />
                              Passwords do not match
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* =================================================
                        ERROR
                    ================================================= */}
                    {error && (
                      <div className="rounded-xl border border-red-100 bg-red-50 p-3">
                        <p className="text-xs font-medium leading-5 text-red-700">
                          {error}
                        </p>
                      </div>
                    )}

                    {/* =================================================
                        SUBMIT
                    ================================================= */}
                    <button
                      type="submit"
                      disabled={
                        isLoading || !isPasswordValid || !passwordsMatch
                      }
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
                        disabled:opacity-60
                      "
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Resetting password...
                        </>
                      ) : (
                        <>
                          Reset Password
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
                      Your new password will replace your previous password.
                      Keep it private and don't share it with anyone.
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

export default ResetPassword;
