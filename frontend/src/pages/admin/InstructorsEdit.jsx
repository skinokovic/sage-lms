import { useEffect, useState } from "react";
import { ArrowLeft, Save, LoaderCircle } from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { fetchInstructor, updateInstructor } from "../../store/instructorSlice";

const InstructorsEdit = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const { selectedInstructor, status, actionStatus, error } = useSelector(
    (state) => state.instructors,
  );

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    specialization: "",
    experience: "",
    bio: "",
    rating: "",
    status: "Pending",
  });

  useEffect(() => {
    dispatch(fetchInstructor(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (!selectedInstructor) return;

    setFormData({
      name: selectedInstructor.name || "",
      email: selectedInstructor.email || "",
      phone: selectedInstructor.phone || "",
      specialization: selectedInstructor.specialization || "",
      experience: selectedInstructor.experience || "",
      bio: selectedInstructor.bio || "",
      rating: selectedInstructor.rating || "",
      status: selectedInstructor.status || "Pending",
    });
  }, [selectedInstructor]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Instructor name is required.");
      return;
    }

    if (!formData.email.trim()) {
      toast.error("Instructor email is required.");
      return;
    }

    try {
      await dispatch(
        updateInstructor({
          id,
          payload: {
            ...formData,
            rating: formData.rating === "" ? 0 : Number(formData.rating),
          },
        }),
      ).unwrap();

      toast.success("Instructor updated successfully.");

      navigate(`/dashboard/admin/instructors/${id}`);
    } catch (error) {
      toast.error(error || "Failed to update instructor.");
    }
  };

  if (status === "loading" || !selectedInstructor) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <LoaderCircle size={36} className="animate-spin text-[#B00000]" />

          <p className="text-sm">Loading instructor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/admin/instructors/${id}`)}
            className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#B00000]"
          >
            <ArrowLeft size={17} />
            Back to Instructor
          </button>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Edit Instructor
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Update instructor profile and account information.
          </p>
        </div>
      </div>

      {/* FORM */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* BASIC INFORMATION */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Basic Information</h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* NAME */}
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="Enter instructor name"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="Enter email address"
              />
            </div>

            {/* PHONE */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>

              <input
                id="phone"
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="+234..."
              />
            </div>

            {/* STATUS */}
            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#B00000]"
              >
                <option value="Active">Active</option>

                <option value="Pending">Pending</option>

                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* PROFESSIONAL INFORMATION */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">
            Professional Information
          </h2>

          <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* SPECIALIZATION */}
            <div>
              <label
                htmlFor="specialization"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Specialization
              </label>

              <input
                id="specialization"
                name="specialization"
                type="text"
                value={formData.specialization}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="e.g. Full-Stack Development"
              />
            </div>

            {/* EXPERIENCE */}
            <div>
              <label
                htmlFor="experience"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Experience
              </label>

              <input
                id="experience"
                name="experience"
                type="text"
                value={formData.experience}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="e.g. 8 years"
              />
            </div>

            {/* RATING */}
            <div>
              <label
                htmlFor="rating"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Rating
              </label>

              <input
                id="rating"
                name="rating"
                type="number"
                min="0"
                max="5"
                step="0.1"
                value={formData.rating}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="0 - 5"
              />
            </div>

            {/* BIO */}
            <div className="md:col-span-2">
              <label
                htmlFor="bio"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Biography
              </label>

              <textarea
                id="bio"
                name="bio"
                rows={5}
                value={formData.bio}
                onChange={handleChange}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#B00000] focus:ring-2 focus:ring-[#B00000]/10"
                placeholder="Enter instructor biography..."
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => navigate(`/dashboard/admin/instructors/${id}`)}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={actionStatus === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionStatus === "loading" ? (
              <>
                <LoaderCircle size={17} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={17} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstructorsEdit;
