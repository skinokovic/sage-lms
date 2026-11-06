import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  LockKeyhole,
  Mail,
  Phone,
  User,
  ShieldCheck,
} from "lucide-react";
import { toast } from "react-toastify";

import { authApi } from "../../api/authApi";

const CreateStudent = () => {
  const navigate = useNavigate();

  const { user } = useSelector((state) => state.auth);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    temporaryPassword: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error("Please enter the student's full name.");
      return;
    }

    if (!form.email.trim()) {
      toast.error("Please enter the student's email.");
      return;
    }

    if (form.temporaryPassword.length < 8) {
      toast.error("Temporary password must be at least 8 characters.");
      return;
    }

    if (form.temporaryPassword !== form.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await authApi.createStudent({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        temporaryPassword: form.temporaryPassword,
      });

      toast.success(
        response.data?.message || "Student account created successfully.",
      );

      navigate("/dashboard/admin/students");
    } catch (error) {
      console.error("CREATE STUDENT ERROR:", error);

      toast.error(error.response?.data?.message || "Failed to create student.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      {/* HEADER */}
      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/students")}
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-primary"
        >
          <ArrowLeft size={17} />
          Back to Students
        </button>

        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Create Student
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create a student account with temporary login credentials.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="border-b border-gray-100 p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-primary">
                <GraduationCap size={22} />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Student Information
                </h2>

                <p className="text-sm text-gray-500">
                  Enter the student's account details.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 sm:p-6">
            {/* NAME */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
                <span className="text-primary"> *</span>
              </label>

              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* EMAIL */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Student Email
                <span className="text-primary"> *</span>
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="student@example.com"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Phone Number
                <span className="ml-1 text-xs font-normal text-gray-400">
                  (Optional)
                </span>
              </label>

              <div className="relative">
                <Phone
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="08012345678"
                  className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
            </div>

            <div className="border-t border-gray-100 pt-6">
              <h3 className="mb-1 font-semibold text-gray-900">
                Temporary Login
              </h3>

              <p className="mb-5 text-sm text-gray-500">
                These credentials will be used for the student's first login.
              </p>

              {/* TEMP PASSWORD */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Temporary Password
                  <span className="text-primary"> *</span>
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showPassword ? "text" : "password"}
                    name="temporaryPassword"
                    value={form.temporaryPassword}
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CONFIRM PASSWORD */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Confirm Temporary Password
                  <span className="text-primary"> *</span>
                </label>

                <div className="relative">
                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter temporary password"
                    className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    aria-label={
                      showConfirmPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50 p-5 sm:flex-row sm:justify-end sm:p-6">
            <button
              type="button"
              onClick={() => navigate("/dashboard/admin/students")}
              disabled={loading}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Creating Student..." : "Create Student"}
            </button>
          </div>
        </form>

        {/* INFORMATION PANEL */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-secondary shadow-sm">
              <ShieldCheck size={20} />
            </div>

            <h3 className="font-semibold text-gray-900">Temporary Account</h3>

            <p className="mt-2 text-sm leading-6 text-gray-600">
              The student will be required to change this temporary password
              after their first successful login.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900">Account Process</h3>

            <div className="mt-4 space-y-4">
              {[
                "Admin creates the student account",
                "Student receives temporary credentials",
                "Student logs in",
                "Student creates a new password",
                "Student accesses the dashboard",
              ].map((step, index) => (
                <div key={step} className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                    {index + 1}
                  </div>

                  <p className="pt-1 text-sm text-gray-600">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStudent;
