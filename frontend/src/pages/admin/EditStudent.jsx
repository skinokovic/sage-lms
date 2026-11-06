import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ArrowLeft, Save, User, GraduationCap } from "lucide-react";
import { toast } from "react-toastify";

import {
  fetchStudentById,
  updateStudent,
  clearCurrentStudent,
} from "../../store/adminStudentSlice";

const AdminEditStudent = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { studentId } = useParams();

  const {
    current: student,
    currentStatus,
    currentError,
    saving,
  } = useSelector((state) => state.adminStudents);

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
  });

  useEffect(() => {
    dispatch(fetchStudentById(studentId));

    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, studentId]);

  useEffect(() => {
    if (!student) return;

    setForm({
      name: student.name || "",
      email: student.email || "",
      phone: student.phone || "",
      isActive: student.isActive,
    });
  }, [student]);

  const handleChange = (field, value) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const validate = () => {
    if (!form.name.trim()) {
      toast.error("Student name is required.");
      return false;
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      toast.error("Enter a valid email address.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    try {
      await dispatch(
        updateStudent({
          id: studentId,
          payload: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            isActive: form.isActive,
          },
        }),
      ).unwrap();

      toast.success("Student updated successfully.");
      navigate(`/dashboard/admin/students/${studentId}`);
    } catch (error) {
      toast.error(error || "Unable to save changes.");
    }
  };

  if (currentStatus === "loading" || currentStatus === "idle") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-primary" />
          <p className="mt-4 text-sm text-gray-500">Loading student...</p>
        </div>
      </div>
    );
  }

  if (currentError || !student) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center px-4">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-primary">
            <GraduationCap size={26} />
          </div>
          <h1 className="mt-4 text-xl font-bold text-gray-900">
            Student not found
          </h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            We could not find the student associated with this URL. Return to
            Students and select one again.
          </p>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/students")}
            className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000]"
          >
            <ArrowLeft size={17} />
            Back to Students
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate(`/dashboard/admin/students/${studentId}`)}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={17} />
            Back to Student
          </button>

          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Edit Student
          </h1>
          <p className="mt-1 text-sm text-gray-500">{student.name}</p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save size={17} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-secondary">
            <User size={20} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Student Information</h2>
            <p className="text-sm text-gray-500">
              Update this student's contact details.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <Field label="Full Name" required>
            <input
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="input"
              placeholder="Enter full name"
            />
          </Field>

          <Field label="Email Address" required>
            <input
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="input"
              placeholder="student@example.com"
            />
          </Field>

          <Field label="Phone Number">
            <input
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              className="input"
              placeholder="e.g. +234 803 456 7890"
            />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6">
          <h2 className="font-bold text-gray-900">Account Status</h2>
          <p className="text-sm text-gray-500">
            Control whether this student can log in.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <StatusOption
            active={form.isActive}
            title="Active"
            description="Student can log in and access their courses."
            onClick={() => handleChange("isActive", true)}
          />
          <StatusOption
            active={!form.isActive}
            title="Inactive"
            description="Student is blocked from logging in."
            onClick={() => handleChange("isActive", false)}
          />
        </div>
      </section>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="block">
    <span className="mb-2 block text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-primary">*</span>}
    </span>
    {children}
  </label>
);

const StatusOption = ({ active, title, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-xl border p-4 text-left transition ${
      active
        ? "border-primary bg-red-50 ring-1 ring-primary"
        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
    }`}
  >
    <div className="flex items-start gap-3">
      <div
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 ${
          active ? "border-primary bg-primary" : "border-gray-300"
        }`}
      >
        {active && (
          <div className="flex h-full items-center justify-center">
            <div className="h-2 w-2 rounded-full bg-white" />
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  </button>
);

export default AdminEditStudent;
