import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, UserPlus, ShieldCheck } from "lucide-react";
import { toast } from "react-toastify";

import { authApi } from "../../api/authApi";

const CreateInstructor = () => {
  const navigate = useNavigate();

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

    // -----------------------------
    // Validation
    // -----------------------------

    if (!form.name.trim() || !form.email.trim() || !form.temporaryPassword) {
      toast.error("Please fill in all required fields.");
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

      const result = await authApi.createInstructor({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        temporaryPassword: form.temporaryPassword,
      });

      toast.success(
        result.data?.message || "Instructor account created successfully.",
      );

      navigate("/dashboard/admin/instructors");
    } catch (error) {
      console.error("CREATE INSTRUCTOR ERROR:", error);

      toast.error(
        error.response?.data?.message || "Failed to create instructor.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}

      <div className="mb-6">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/instructors")}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#B00000]"
        >
          <ArrowLeft size={18} />
          Back to Instructors
        </button>

        <div className="mt-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Create Instructor
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Create an instructor account with a temporary password.
          </p>
        </div>
      </div>

      {/* Main content */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}

        <div className="lg:col-span-2">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-7"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <UserPlus size={20} className="text-[#B00000]" />
              </div>

              <div>
                <h2 className="font-semibold text-gray-900">
                  Instructor Information
                </h2>

                <p className="text-xs text-gray-500">
                  Enter the instructor's account details.
                </p>
              </div>
            </div>

            {/* Name */}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
                <span className="text-red-500"> *</span>
              </label>

              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter instructor's full name"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Email */}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
                <span className="text-red-500"> *</span>
              </label>

              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="instructor@example.com"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Phone */}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
                <span className="text-gray-400 font-normal"> (Optional)</span>
              </label>

              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="08012345678"
                className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
              />
            </div>

            {/* Temporary password */}

            <div className="mb-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temporary Password
                <span className="text-red-500"> *</span>
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="temporaryPassword"
                  value={form.temporaryPassword}
                  onChange={handleChange}
                  placeholder="Minimum 8 characters"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}

            <div className="mb-7">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Temporary Password
                <span className="text-red-500"> *</span>
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Re-enter temporary password"
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-red-100"
                />

                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={19} />
                  ) : (
                    <Eye size={19} />
                  )}
                </button>
              </div>
            </div>

            {/* Actions */}

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard/admin/instructors")}
                className="px-5 py-3 rounded-xl border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-3 rounded-xl bg-[#B00000] text-white text-sm font-semibold hover:bg-red-800 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Instructor..." : "Create Instructor"}
              </button>
            </div>
          </form>
        </div>

        {/* Information panel */}

        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-6">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
              <ShieldCheck size={22} className="text-[#1E3A8A]" />
            </div>

            <h3 className="font-semibold text-gray-900">Account Security</h3>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              This instructor will receive a temporary password created by the
              administrator.
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">
                  Account role will be set to instructor.
                </span>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">
                  Instructor must change the temporary password after login.
                </span>
              </div>

              <div className="flex gap-3">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">
                  Password must contain at least 8 characters.
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateInstructor;
