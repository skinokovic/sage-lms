import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock3,
  Mail,
  Phone,
  Pencil,
  ShieldCheck,
  ShieldOff,
  Trash2,
  UserPlus,
  UserX,
  GraduationCap,
} from "lucide-react";
import { toast } from "react-toastify";

import {
  fetchStudentById,
  updateStudent,
  removeStudent,
  clearCurrentStudent,
} from "../../store/adminStudentSlice";
import EnrollStudentModal from "../../components/admin/EnrollStudentModal"; // adjust to where you place the modal

const PAYMENT_LABELS = {
  paystack: "Paystack",
  bank_transfer: "Bank transfer",
  cash: "Cash",
  complimentary: "Complimentary",
  free: "Free course",
};

const formatEnrolledDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
    : "—";

const formatNaira = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const AdminStudentDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { studentId } = useParams();

  const {
    current: student,
    currentStatus,
    currentError,
    saving,
  } = useSelector((state) => state.adminStudents);

  const [showEnroll, setShowEnroll] = useState(false);

  // Set when the modal saved at least one enrollment, so the page can refresh
  // once the admin closes it (refreshing earlier would hide the result screen).
  const enrolledRef = useRef(false);

  useEffect(() => {
    dispatch(fetchStudentById(studentId));

    return () => {
      dispatch(clearCurrentStudent());
    };
  }, [dispatch, studentId]);

  const getInitials = (name) =>
    (name || "")
      .split(" ")
      .filter(Boolean)
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const getStatusBadge = (status) => {
    if (status === "Active") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
          <CheckCircle2 size={13} />
          Active
        </span>
      );
    }

    if (status === "Pending") {
      return (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
          <Clock3 size={13} />
          Pending
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
        <UserX size={13} />
        Inactive
      </span>
    );
  };

  const handleToggleActive = () => {
    if (!student) return;

    dispatch(
      updateStudent({
        id: studentId,
        payload: { isActive: !student.isActive },
      }),
    )
      .unwrap()
      .then(() => {
        toast.success(
          student.isActive ? "Student deactivated." : "Student reactivated.",
        );
      })
      .catch((error) => {
        toast.error(error || "Unable to update student status.");
      });
  };

  const handleRemove = () => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${student.name}?`,
    );

    if (!confirmed) return;

    dispatch(removeStudent(studentId))
      .unwrap()
      .then(() => {
        toast.success(`${student.name} has been removed.`);
      })
      .catch((error) => {
        toast.error(error || "Unable to remove this student.");
      });
  };

  const closeEnroll = () => {
    setShowEnroll(false);

    // Reload the student so the Courses and Completed counts are up to date.
    if (enrolledRef.current) {
      enrolledRef.current = false;
      dispatch(fetchStudentById(studentId));
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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard/admin/students")}
            className="mb-3 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 hover:text-primary"
          >
            <ArrowLeft size={17} />
            Back to Students
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              {student.name}
            </h1>
            {getStatusBadge(student.status)}
          </div>
          <p className="mt-1 text-sm text-gray-500">{student.email}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowEnroll(true)}
            disabled={!student.isActive}
            title={
              student.isActive
                ? "Enroll this student in courses"
                : "Reactivate this student before enrolling them"
            }
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <UserPlus size={17} />
            Enroll in Course
          </button>

          <button
            type="button"
            onClick={() =>
              navigate(`/dashboard/admin/students/${studentId}/edit`)
            }
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
          >
            <Pencil size={17} />
            Edit Student
          </button>

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={saving}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-60 ${
              student.isActive
                ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "bg-secondary text-white hover:bg-[#172f70]"
            }`}
          >
            {student.isActive ? (
              <ShieldOff size={17} />
            ) : (
              <ShieldCheck size={17} />
            )}
            {saving
              ? "Updating..."
              : student.isActive
                ? "Deactivate"
                : "Reactivate"}
          </button>

          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            <Trash2 size={17} />
            Remove
          </button>
        </div>
      </section>

      {/* Summary */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard icon={BookOpen} label="Courses" value={student.courses} />
        <SummaryCard
          icon={CheckCircle2}
          label="Completed"
          value={student.completed}
        />
        <SummaryCard icon={Clock3} label="Joined" value={student.joined} />
        <SummaryCard
          icon={GraduationCap}
          label="Last Active"
          value={student.lastActive}
        />
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* Main */}
        <main className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-bold text-secondary">
                {getInitials(student.name)}
              </div>
              <div>
                <h2 className="font-bold text-gray-900">{student.name}</h2>
                <p className="text-sm text-gray-500">Student</p>
              </div>
            </div>

            <div className="space-y-4">
              <InfoRow icon={Mail} label="Email" value={student.email} />
              <InfoRow
                icon={Phone}
                label="Phone"
                value={student.phone || "Not provided"}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="font-bold text-gray-900">Enrolled courses</h2>

            {student.enrolledCourses?.length ? (
              <div className="mt-4 space-y-3">
                {student.enrolledCourses.map((course) => (
                  <div
                    key={course.enrollmentId}
                    className="rounded-xl border border-gray-100 p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="min-w-0 text-sm font-semibold text-gray-900">
                        {course.title}
                      </p>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
                          course.status === "completed"
                            ? "bg-green-50 text-green-700"
                            : course.status === "revoked"
                              ? "bg-gray-100 text-gray-500"
                              : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {course.status}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {PAYMENT_LABELS[course.paymentMethod] ||
                        course.paymentMethod}
                      {course.amountPaid > 0 &&
                        ` · ${formatNaira(course.amountPaid)}`}
                      {` · Enrolled ${formatEnrolledDate(course.enrolledAt)}`}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                This student isn't enrolled in any course yet.
              </p>
            )}
          </section>

          {student.status === "Pending" && (
            <section className="rounded-2xl border border-yellow-100 bg-yellow-50 p-5">
              <div className="flex gap-3">
                <Clock3 size={20} className="mt-0.5 shrink-0 text-yellow-600" />
                <div>
                  <p className="text-sm font-semibold text-yellow-900">
                    Awaiting activation
                  </p>
                  <p className="mt-1 text-sm leading-6 text-yellow-700">
                    This student hasn't logged in and set their own password
                    yet. They're still using the temporary password you created
                    their account with.
                  </p>
                </div>
              </div>
            </section>
          )}
        </main>

        {/* Sidebar */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-gray-900">Account Status</h2>

            <div className="mt-4 rounded-xl bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    student.isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {student.isActive ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <UserX size={20} />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {student.isActive ? "Active account" : "Deactivated"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    {student.isActive
                      ? "Can log in and access their courses."
                      : "Cannot log in until reactivated."}
                  </p>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Enrollment modal, already set to this student */}
      {showEnroll && (
        <EnrollStudentModal
          initialStudent={{
            id: studentId,
            name: student.name,
            email: student.email,
          }}
          onClose={closeEnroll}
          onEnrolled={() => {
            enrolledRef.current = true;
          }}
        />
      )}
    </div>
  );
};

const SummaryCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
    <div className="flex items-center gap-2 text-gray-400">
      <Icon size={17} />
      <span className="text-xs">{label}</span>
    </div>
    <p className="mt-2 truncate text-lg font-bold text-gray-900">{value}</p>
  </div>
);

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500">
      <Icon size={16} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400">{label}</p>
      <p className="truncate text-sm font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

export default AdminStudentDetails;
