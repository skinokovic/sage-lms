import { useEffect, useState } from "react";

import { useDispatch, useSelector } from "react-redux";

import { Link, useNavigate } from "react-router-dom";

import { ArrowLeft, Mail, ShieldCheck } from "lucide-react";

import FormField from "../components/FormField";
import PasswordField from "../components/PasswordField";
import { PrimaryButton } from "../components/Buttons";
import SocialButton from "../components/SocialButton";
import AuthHeroPanel from "../components/AuthHeroPanel";

import {
  loginUser,
  clearAuthError,
  googleLogin,
  facebookLogin,
} from "../store/authSlice";

import { toast } from "react-toastify";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { status, error } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  /*
  |--------------------------------------------------------------------------
  | Load the Google + Facebook SDKs once, on mount.
  |--------------------------------------------------------------------------
  | Both scripts are only needed on this page, so they're injected here
  | rather than in index.html. Each is guarded so it only ever loads once,
  | even if this page remounts.
  */
  useEffect(() => {
    if (!document.getElementById("google-identity-script")) {
      const script = document.createElement("script");
      script.id = "google-identity-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    if (!document.getElementById("facebook-jssdk")) {
      window.fbAsyncInit = function fbAsyncInit() {
        window.FB.init({
          appId: import.meta.env.VITE_FACEBOOK_APP_ID,
          cookie: true,
          xfbml: false,
          version: "v19.0",
        });
      };

      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  //HandleChange

  const handleChange = (e) => {
    setForm((f) => ({
      ...f,
      [e.target.name]: e.target.value,
    }));
  };

  const validate = () => {
    const errors = {};

    if (!form.email.trim()) {
      errors.email = "Enter your email";
    }

    if (!form.password) {
      errors.password = "Enter your password";
    }

    setFieldErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    dispatch(clearAuthError());

    if (!validate()) return;

    try {
      const result = await dispatch(loginUser(form)).unwrap();

      toast.success("Login successful");

      console.log("LOGIN RESULT:", result);

      // --------------------------------------------------
      // Student/admin/instructor must change temporary
      // password before accessing the dashboard
      // --------------------------------------------------

      if (result?.user?.mustChangePassword) {
        navigate("/change-password", {
          replace: true,
        });

        return;
      }

      // Normal login
      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      console.error("LOGIN ERROR:", error);
    }
  };

  const handleGoogleLogin = () => {
    if (!window.google?.accounts?.oauth2) {
      toast.error(
        "Google sign-in isn't ready yet — please try again in a moment.",
      );
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: async (response) => {
        if (response.error) {
          toast.error("Google sign-in was cancelled or failed.");
          return;
        }

        try {
          await dispatch(googleLogin(response.access_token)).unwrap();
          toast.success("Login successfully");
          navigate("/dashboard");
        } catch (err) {
          toast.error(err || "Google sign-in failed.");
        }
      },
    });

    client.requestAccessToken();
  };

  // const handleFacebookLogin = () => {
  //   if (!window.FB) {
  //     toast.error(
  //       "Facebook sign-in isn't ready yet — please try again in a moment.",
  //     );
  //     return;
  //   }

  //   window.FB.login(
  //     (response) => {
  //       if (!response.authResponse) {
  //         toast.error("Facebook sign-in was cancelled.");
  //         return;
  //       }

  //       dispatch(facebookLogin(response.authResponse.accessToken))
  //         .unwrap()
  //         .then(() => {
  //           toast.success("Login successfully");
  //           navigate("/dashboard");
  //         })
  //         .catch((err) => {
  //           toast.error(err || "Facebook sign-in failed.");
  //         });
  //     },
  //     { scope: "email,public_profile" },
  //   );
  // };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-blue-50">
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
                <div className="mb-3 inline-flex items-center rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-primary">
                  Welcome back
                </div>

                <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                  Welcome Back
                </h1>

                <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Log in to continue your learning journey with SAGE LMS.
                </p>
              </div>

              {/* =================================================
                  LOGIN FORM
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
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  error={fieldErrors.password}
                  autoComplete="current-password"
                />

                {/* Forgot password */}
                <div className="-mt-1 flex justify-end">
                  <Link
                    to="/forgot-password"
                    className="text-sm font-semibold text-secondary transition duration-200 hover:text-blue-800"
                  >
                    Forgot password?
                  </Link>
                </div>

                {/* Login button */}
                <PrimaryButton type="submit" loading={status === "loading"}>
                  Log in
                </PrimaryButton>

                {/* Divider */}
                <div className="flex items-center gap-3 py-1 text-xs font-medium uppercase tracking-wider text-gray-400 before:h-px before:flex-1 before:bg-gray-200 before:content-[''] after:h-px after:flex-1 after:bg-gray-200 after:content-['']">
                  Or continue with
                </div>

                {/* =================================================
                    SOCIAL LOGIN
                ================================================= */}

                <div className="flex justify-center">
                  <div className="w-full max-w-xs [&>button]:w-full">
                    <SocialButton provider="google" onClick={handleGoogleLogin}>
                      Google
                    </SocialButton>
                  </div>
                </div>
                {/* <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 ">
                  <SocialButton provider="google" onClick={handleGoogleLogin}>
                    Google
                  </SocialButton>

                  <SocialButton
                    provider="facebook"
                    onClick={handleFacebookLogin}
                  >
                    Facebook
                  </SocialButton>
                </div> */}

                {/* Create account */}
                <p className="pt-2 text-center text-sm text-gray-500">
                  New to SAGE?{" "}
                  <Link
                    to="/create-account"
                    className="font-semibold text-secondary transition duration-200 hover:text-blue-800 hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </form>
            </div>

            {/* ===================================================
                HERO SECTION
            =================================================== */}
            <div className="order-1 min-h-65 md:order-2 md:min-h-full">
              <AuthHeroPanel
                title="Learn without limits"
                subtitle="Courses built by industry experts, at your own pace."
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
