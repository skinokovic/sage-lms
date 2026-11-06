import { useEffect } from "react";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  BookOpen,
  Users,
  Star,
  GraduationCap,
  CalendarDays,
  BriefcaseBusiness,
  LoaderCircle,
  CheckCircle2,
  Clock3,
  UserX,
} from "lucide-react";

import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";

import { fetchInstructor } from "../../store/instructorSlice";

const InstructorsDetails = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { id } = useParams();

  const { selectedInstructor, status, error } = useSelector(
    (state) => state.instructors,
  );

  useEffect(() => {
    dispatch(fetchInstructor(id));
  }, [dispatch, id]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const getStatusStyle = (statusValue) => {
    switch (statusValue) {
      case "Active":
        return {
          classes: "bg-green-50 text-green-700 border-green-200",
          icon: CheckCircle2,
        };

      case "Pending":
        return {
          classes: "bg-yellow-50 text-yellow-700 border-yellow-200",
          icon: Clock3,
        };

      case "Inactive":
        return {
          classes: "bg-gray-100 text-gray-600 border-gray-200",
          icon: UserX,
        };

      default:
        return {
          classes: "bg-gray-100 text-gray-600 border-gray-200",
          icon: UserX,
        };
    }
  };

  const getInitials = (name = "") => {
    return name
      .split(" ")
      .filter(Boolean)
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  const formatDate = (date) => {
    if (!date) return "Not available";

    return new Date(date).toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
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

  const instructor = selectedInstructor;

  const statusStyle = getStatusStyle(instructor.status);

  const StatusIcon = statusStyle.icon;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() => navigate("/dashboard/admin/instructors")}
          className="inline-flex w-fit items-center gap-2 text-sm font-medium text-gray-600 hover:text-[#B00000]"
        >
          <ArrowLeft size={18} />
          Back to Instructors
        </button>

        <button
          type="button"
          onClick={() =>
            navigate(`/dashboard/admin/instructors/${instructor.id}/edit`)
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#B00000] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#8f0000]"
        >
          <Pencil size={17} />
          Edit Instructor
        </button>
      </div>

      {/* PROFILE CARD */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {instructor.avatarUrl ? (
            <img
              src={instructor.avatarUrl}
              alt={instructor.name}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A]/10 text-2xl font-bold text-[#1E3A8A]">
              {getInitials(instructor.name)}
            </div>
          )}

          <div className="flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                {instructor.name}
              </h1>

              <span
                className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.classes}`}
              >
                <StatusIcon size={14} />
                {instructor.status}
              </span>
            </div>

            <p className="mt-2 text-gray-500">
              {instructor.specialization || "Instructor"}
            </p>

            <div className="mt-4 flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:gap-5">
              <span className="inline-flex items-center gap-2">
                <Mail size={16} />
                {instructor.email}
              </span>

              <span className="inline-flex items-center gap-2">
                <Phone size={16} />
                {instructor.phone || "No phone"}
              </span>

              <span className="inline-flex items-center gap-2">
                <CalendarDays size={16} />
                Joined {formatDate(instructor.joined)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-[#1E3A8A]">
              <BookOpen size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Courses</p>

              <p className="text-2xl font-bold text-gray-900">
                {instructor.courses || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-red-50 p-3 text-[#B00000]">
              <Users size={21} />
            </div>

            <div>
              <p className="text-sm text-gray-500">Students</p>

              <p className="text-2xl font-bold text-gray-900">
                {instructor.students || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-yellow-50 p-3 text-yellow-600">
              <Star size={21} className="fill-yellow-400" />
            </div>

            <div>
              <p className="text-sm text-gray-500">Rating</p>

              <p className="text-2xl font-bold text-gray-900">
                {instructor.rating || "No rating"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* PROFESSIONAL INFORMATION */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <BriefcaseBusiness size={20} className="text-[#1E3A8A]" />

            <h2 className="text-lg font-bold text-gray-900">
              Professional Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Specialization
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {instructor.specialization || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Experience
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {instructor.experience || "Not specified"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Instructor ID
              </p>

              <p className="mt-1 break-all font-mono text-sm text-gray-700">
                {instructor.id}
              </p>
            </div>
          </div>
        </div>

        {/* ACCOUNT INFORMATION */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2">
            <GraduationCap size={20} className="text-[#B00000]" />

            <h2 className="text-lg font-bold text-gray-900">
              Account Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Name
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {instructor.name}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Email
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {instructor.email}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Phone
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {instructor.phone || "Not provided"}
              </p>
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Joined
              </p>

              <p className="mt-1 font-medium text-gray-800">
                {formatDate(instructor.joined)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BIO */}
      {instructor.bio && (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-gray-900">Biography</h2>

          <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600">
            {instructor.bio}
          </p>
        </div>
      )}
    </div>
  );
};

export default InstructorsDetails;
