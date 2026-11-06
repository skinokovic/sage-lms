import { useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Link, useNavigate } from "react-router-dom";

import { ArrowLeft, Mail, ShieldCheck, User } from "lucide-react";

import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import { PrimaryButton } from "../components/Buttons";
import AuthHeroPanel from "../components/AuthHeroPanel";

import { registerUser, clearAuthError } from "../store/authSlice";

import { toast } from "react-toastify";

export default function CreateAccount() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    agreeToTerms: false,
  });

  const [fieldErrors, setFieldErrors] = useState({});

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;

    setForm((f) => ({
      ...f,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.name.trim()) {
      errors.name = "Enter your name";
    }

    if (!form.email.trim()) {
      errors.email = "Enter your email";
    }

    if (!form.password || form.password.length < 8) {
      errors.password = "Use at least 8 characters";
    }

    if (!form.agreeToTerms) {
      errors.agreeToTerms = "You need to accept the terms to continue";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(clearAuthError());

    if (!validate()) return;

    const { agreeToTerms, ...payload } = form;

    try {
      await dispatch(registerUser(payload)).unwrap();

      toast.success("User account created successfully");

      setForm({
        name: "",
        email: "",
        password: "",
        agreeToTerms: false,
      });

      navigate("/login");
    } catch (error) {
      console.error("Registration failed:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* =========================================================
          TOP BRAND BAR
      ========================================================= */}
      <header className="border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            aria-label="SAGE LMS home"
            className="text-lg font-bold tracking-tight text-primary transition-opacity duration-200 hover:opacity-80"
          >
            SAGE LMS
          </Link>
        </div>
      </header>

      {/* =========================================================
          MAIN CONTENT
      ========================================================= */}
      <main className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <div className="w-full max-w-5xl">
          {/* =====================================================
              AUTH CARD
          ===================================================== */}
          <div className="grid overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl shadow-gray-200/50 md:grid-cols-[1.15fr_0.85fr]">
            {/* ===================================================
                FORM SECTION
            =================================================== */}
            <div className="order-2 flex flex-col p-6 sm:p-8 lg:p-11 md:order-1">
              {/* Back button */}
              <div className="mb-7">
                <Link
                  to="/"
                  aria-label="Back to home"
                  title="Back to home"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition duration-200 hover:bg-gray-100 hover:text-primary"
                >
                  <ArrowLeft size={19} />
                </Link>
              </div>

              {/* Heading */}
              <div className="mb-7">
                <div className="mb-3 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-secondary">
                  Get started
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Create Your Account
                </h1>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Join SAGE and start building your skills with practical,
                  expert-led courses.
                </p>
              </div>

              {/* =================================================
                  REGISTRATION FORM
              ================================================= */}
              <form
                className="flex flex-col gap-5"
                onSubmit={handleSubmit}
                noValidate
              >
                {/* Backend error */}
                {error && (
                  <div className="flex gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-primary">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0" />

                    <p>{error}</p>
                  </div>
                )}

                {/* Name */}
                <FormField
                  id="name"
                  name="name"
                  label="Full name"
                  icon={User}
                  placeholder="Enter your full name"
                  value={form.name}
                  onChange={handleChange}
                  error={fieldErrors.name}
                  autoComplete="name"
                />

                {/* Email */}
                <FormField
                  id="email"
                  name="email"
                  label="Email address"
                  type="email"
                  icon={Mail}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  error={fieldErrors.email}
                  autoComplete="email"
                />

                {/* Password */}
                <PasswordField
                  id="password"
                  name="password"
                  label="Password"
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  autoComplete="new-password"
                />

                {/* =================================================
                    TERMS AND CONDITIONS
                ================================================= */}
                <div>
                  <div className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3.5">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      name="agreeToTerms"
                      checked={form.agreeToTerms}
                      onChange={handleChange}
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-primary"
                    />

                    <label
                      htmlFor="agreeToTerms"
                      className="cursor-pointer text-xs leading-5 text-gray-600"
                    >
                      I agree with{" "}
                      <Link
                        to="/terms-of-service"
                        className="font-semibold text-secondary hover:underline"
                      >
                        Terms &amp; Conditions
                      </Link>{" "}
                      and understand that my account will be subject to the SAGE
                      LMS policies.
                    </label>
                  </div>

                  {fieldErrors.agreeToTerms && (
                    <p className="mt-2 text-xs font-medium text-primary">
                      {fieldErrors.agreeToTerms}
                    </p>
                  )}
                </div>

                {/* Create account button */}
                <PrimaryButton type="submit" loading={status === "loading"}>
                  Create Account
                </PrimaryButton>

                {/* Existing account */}
                <p className="pt-2 text-center text-sm text-gray-500">
                  Already have an account?{" "}
                  <Link
                    to="/login"
                    className="font-semibold text-secondary transition duration-200 hover:text-blue-800 hover:underline"
                  >
                    Log in
                  </Link>
                </p>
              </form>
            </div>

            {/* ===================================================
                HERO SECTION
            =================================================== */}
            <div className="order-1 min-h-[260px] md:order-2 md:min-h-full">
              <AuthHeroPanel
                title="Join the community"
                subtitle="Thousands of learners building their future with SAGE."
              />
            </div>
          </div>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} SAGE LMS. All rights reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
