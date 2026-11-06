import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

import axiosClient from "../api/axiosClient";
import { setUser } from "../store/authSlice";

const ChangePassword = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const getDashboardPath = (role) => {
    switch (role) {
      case "admin":
        return "/dashboard/admin";

      case "instructor":
        return "/dashboard/instructor";

      case "student":
      default:
        return "/dashboard/student";
    }
  };

  const validatePassword = () => {
    if (!form.currentPassword) {
      toast.error("Please enter your current password.");
      return false;
    }

    if (!form.newPassword) {
      toast.error("Please enter your new password.");
      return false;
    }

    if (form.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return false;
    }

    if (form.newPassword === form.currentPassword) {
      toast.error(
        "Your new password must be different from your current password.",
      );
      return false;
    }

    if (!form.confirmPassword) {
      toast.error("Please confirm your new password.");
      return false;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setLoading(true);

      const { data } = await axiosClient.patch("/auth/change-password", {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      /*
       * The backend should return the updated user.
       *
       * Example:
       * {
       *   success: true,
       *   message: "Password changed successfully.",
       *   user: {...}
       * }
       */

      if (data?.user) {
        dispatch(setUser(data.user));
      } else if (user) {
        /*
         * Fallback in case the backend only returns
         * success/message.
         */
        dispatch(
          setUser({
            ...user,
            mustChangePassword: false,
          }),
        );
      }

      toast.success(data?.message || "Password changed successfully.");

      const dashboard = getDashboardPath(user?.role);

      setTimeout(() => {
        navigate(dashboard, {
          replace: true,
        });
      }, 700);
    } catch (error) {
      console.error("CHANGE PASSWORD ERROR:", error);

      toast.error(
        error.response?.data?.message ||
          "Unable to change your password. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-xl lg:grid-cols-[1fr_420px]">
          {/* LEFT INFORMATION PANEL */}
          <div className="hidden bg-secondary p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                <ShieldCheck size={28} />
              </div>

              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.18em] text-blue-200">
                SAGE LMS
              </p>

              <h1 className="max-w-md text-3xl font-bold leading-tight xl:text-4xl">
                Secure your account before you continue.
              </h1>

              <p className="mt-5 max-w-md text-sm leading-7 text-blue-100">
                Your account was created with temporary login credentials.
                Before accessing your learning dashboard, you need to create
                your own secure password.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              <SecurityItem
                title="Keep your password private"
                description="Never share your password with another person."
              />

              <SecurityItem
                title="Use a strong password"
                description="Choose a password that is difficult for others to guess."
              />

              <SecurityItem
                title="You're almost ready"
                description="Once your password is changed, you'll be taken to your dashboard."
              />
            </div>
          </div>

          {/* FORM */}
          <div className="p-6 sm:p-8 lg:p-10">
            {/* MOBILE ICON */}
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary lg:hidden">
              <LockKeyhole size={24} />
            </div>

            <div className="mb-8">
              <p className="mb-2 text-sm font-semibold text-primary">
                First-time login
              </p>

              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Change your password
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                For your security, you must change your temporary password
                before continuing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* CURRENT PASSWORD */}
              <PasswordField
                label="Current Password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                placeholder="Enter your temporary password"
                show={showCurrentPassword}
                onToggle={() => setShowCurrentPassword((prev) => !prev)}
              />

              {/* NEW PASSWORD */}
              <PasswordField
                label="New Password"
                name="newPassword"
                value={form.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                show={showNewPassword}
                onToggle={() => setShowNewPassword((prev) => !prev)}
              />

              {/* PASSWORD REQUIREMENTS */}
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
                  Password requirements
                </p>

                <div className="grid gap-2 sm:grid-cols-2">
                  <PasswordRequirement
                    met={form.newPassword.length >= 8}
                    text="At least 8 characters"
                  />

                  <PasswordRequirement
                    met={
                      form.newPassword.length > 0 &&
                      form.newPassword !== form.currentPassword
                    }
                    text="Different from old password"
                  />
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Re-enter your new password"
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword((prev) => !prev)}
              />

              {/* MATCH INDICATOR */}
              {form.confirmPassword && (
                <div
                  className={`rounded-lg px-3 py-2 text-xs font-medium ${
                    form.newPassword === form.confirmPassword
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {form.newPassword === form.confirmPassword
                    ? "✓ Passwords match"
                    : "Passwords do not match"}
                </div>
              )}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    Change Password
                    <ArrowRight
                      size={18}
                      className="transition-transform group-hover:translate-x-0.5"
                    />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl bg-blue-50 p-4">
              <p className="text-xs leading-5 text-blue-700">
                After changing your password, your temporary login password will
                no longer work.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* --------------------------------------------------
   PASSWORD FIELD
-------------------------------------------------- */

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  show,
  onToggle,
}) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        <LockKeyhole
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />

        <input
          type={show ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={
            name === "currentPassword" ? "current-password" : "new-password"
          }
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-12 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label={show ? `Hide ${label}` : `Show ${label}`}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    </div>
  );
};

/* --------------------------------------------------
   PASSWORD REQUIREMENT
-------------------------------------------------- */

const PasswordRequirement = ({ met, text }) => {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        size={15}
        className={met ? "text-green-500" : "text-gray-300"}
      />

      <span
        className={met ? "text-xs text-green-700" : "text-xs text-gray-500"}
      >
        {text}
      </span>
    </div>
  );
};

/* --------------------------------------------------
   SECURITY ITEM
-------------------------------------------------- */

const SecurityItem = ({ title, description }) => {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10">
        <CheckCircle2 size={15} />
      </div>

      <div>
        <p className="text-sm font-semibold">{title}</p>

        <p className="mt-1 text-xs leading-5 text-blue-100/80">{description}</p>
      </div>
    </div>
  );
};

export default ChangePassword;
