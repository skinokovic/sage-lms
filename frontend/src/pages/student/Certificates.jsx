import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileBadge,
  Layers,
  Search,
  Share2,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "react-toastify";
import { fetchMyCertificates } from "../../store/studentCertificateSlice";
import CertificateViewer from "../../components/certificate/CertificateViewer";

const statusFilters = ["All", "Earned", "In Progress"];

const formatLong = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

const Certificates = () => {
  const dispatch = useDispatch();
  const {
    items: certificatesData,
    status: loadStatus,
    error,
  } = useSelector((state) => state.studentCertificates);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewer, setViewer] = useState(null); // { certificate, autoDownload }

  useEffect(() => {
    dispatch(fetchMyCertificates());
  }, [dispatch]);

  const isLoading = loadStatus === "idle" || loadStatus === "loading";
  const hasFailed = loadStatus === "failed";

  const earnedList = certificatesData.filter(
    (item) => item.status === "Earned",
  );
  const earnedCertificates = earnedList.length;
  const inProgressCertificates = certificatesData.filter(
    (item) => item.status === "In Progress",
  ).length;
  const totalCourses = certificatesData.length;

  const latestCertificate = earnedList[0];

  const filteredCertificates = useMemo(() => {
    const term = searchTerm.toLowerCase();

    return certificatesData.filter((certificate) => {
      const matchesSearch =
        certificate.title.toLowerCase().includes(term) ||
        certificate.category.toLowerCase().includes(term) ||
        certificate.instructor.toLowerCase().includes(term) ||
        (certificate.certificateCode || "").toLowerCase().includes(term);

      const matchesStatus =
        statusFilter === "All" || certificate.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [certificatesData, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#B00000]/10 text-[#B00000]">
                <Award size={22} />
              </div>

              <span className="text-sm font-semibold text-[#B00000]">
                Achievements
              </span>
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              My Certificates
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              View and manage your course completion certificates.
            </p>
          </div>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Earned Certificates"
          value={earnedCertificates}
          description="Certificates earned"
          icon={Award}
          iconBg="bg-[#B00000]/10"
          iconColor="text-[#B00000]"
        />

        <SummaryCard
          title="In Progress"
          value={inProgressCertificates}
          description="Courses progressing"
          icon={Clock}
          iconBg="bg-blue-50"
          iconColor="text-[#1E3A8A]"
        />

        <SummaryCard
          title="Total Courses"
          value={totalCourses}
          description="Certificate courses"
          icon={BookOpen}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />

        <SummaryCard
          title="Latest Certificate"
          value={
            latestCertificate
              ? new Date(latestCertificate.issueDate).toLocaleDateString(
                  "en-US",
                  { month: "long" },
                )
              : "—"
          }
          description={
            latestCertificate
              ? formatLong(latestCertificate.issueDate)
              : "No certificate yet"
          }
          icon={FileBadge}
          iconBg="bg-green-50"
          iconColor="text-green-600"
        />
      </div>

      {/* ACHIEVEMENT BANNER */}
      <div className="overflow-hidden rounded-2xl bg-[#1E3A8A] shadow-sm">
        <div className="relative p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5" />
          <div className="absolute -bottom-16 right-20 h-48 w-48 rounded-full bg-white/5" />

          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <div className="mb-3 flex items-center gap-2 text-blue-200">
                <Award size={20} />
                <span className="text-sm font-semibold">
                  Your Learning Achievements
                </span>
              </div>

              <h2 className="text-xl font-bold text-white sm:text-2xl">
                Keep learning, keep achieving.
              </h2>

              <p className="mt-2 text-sm leading-6 text-blue-100">
                Every completed course brings you one step closer to your next
                certificate. Continue your learning journey and build a strong
                portfolio of achievements.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/20 bg-white/10">
                <Award size={36} className="text-white" />
              </div>

              <div>
                <p className="text-3xl font-bold text-white">
                  {earnedCertificates}
                </p>
                <p className="text-sm text-blue-200">Certificates earned</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SEARCH + FILTERS */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* SEARCH */}
          <div className="relative w-full lg:max-w-md">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search certificates..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10"
            />
          </div>

          {/* FILTERS */}
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                  statusFilter === filter
                    ? "bg-[#1E3A8A] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CERTIFICATE COUNT */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Certificates & Progress
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {filteredCertificates.length}{" "}
            {filteredCertificates.length === 1 ? "course" : "courses"} found
          </p>
        </div>
      </div>

      {/* CERTIFICATE GRID */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {[1, 2].map((n) => (
            <div
              key={n}
              className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="h-44 bg-gray-100" />
              <div className="space-y-3 p-6">
                <div className="h-4 w-1/2 rounded bg-gray-100" />
                <div className="h-4 w-1/3 rounded bg-gray-100" />
                <div className="h-11 w-full rounded-xl bg-gray-100" />
              </div>
            </div>
          ))}
        </div>
      ) : hasFailed ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <XCircle size={30} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-900">
            Couldn't load your certificates
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">{error}</p>

          <button
            type="button"
            onClick={() => dispatch(fetchMyCertificates())}
            className="mt-5 cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
          >
            Try Again
          </button>
        </div>
      ) : filteredCertificates.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {filteredCertificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              onView={() => setViewer({ certificate, autoDownload: false })}
              onDownload={() => setViewer({ certificate, autoDownload: true })}
            />
          ))}
        </div>
      ) : (
        <EmptyState hasCourses={certificatesData.length > 0} />
      )}

      {viewer && (
        <CertificateViewer
          certificate={viewer.certificate}
          autoDownload={viewer.autoDownload}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  );
};

/* -------------------------------- */
/* SUMMARY CARD */
/* -------------------------------- */

const SummaryCard = ({
  title,
  value,
  description,
  icon: Icon,
  iconBg,
  iconColor,
}) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>

          <h3 className="mt-2 text-2xl font-bold text-gray-900">{value}</h3>

          <p className="mt-1 text-xs text-gray-400">{description}</p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg} ${iconColor}`}
        >
          <Icon size={21} />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* CERTIFICATE CARD */
/* -------------------------------- */

const CertificateCard = ({ certificate, onView, onDownload }) => {
  const navigate = useNavigate();
  const isEarned = certificate.status === "Earned";

  const share = async () => {
    const url = `${window.location.origin}/verify/${certificate.certificateCode}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `${certificate.title} certificate`,
          text: "Verify my SAGE certificate",
          url,
        });
        return;
      }
      await navigator.clipboard.writeText(url);
      toast.success("Verification link copied.");
    } catch {
      // share sheet cancelled
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {/* TOP SECTION */}
      <div
        className={`relative overflow-hidden p-6 ${
          isEarned
            ? "bg-gradient-to-br from-[#1E3A8A] to-[#172554]"
            : "bg-gray-100"
        }`}
      >
        <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full border border-white/10" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full border border-white/10" />

        <div className="relative flex items-start justify-between gap-4">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
              isEarned
                ? "bg-white/10 text-white"
                : "bg-white text-[#1E3A8A] shadow-sm"
            }`}
          >
            {isEarned ? <Award size={30} /> : <Clock size={28} />}
          </div>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
              isEarned
                ? "bg-green-500/15 text-green-200"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {isEarned ? <CheckCircle2 size={14} /> : <Clock size={14} />}

            {certificate.status}
          </span>
        </div>

        <div className="relative mt-6">
          <p
            className={`text-xs font-semibold uppercase tracking-wider ${
              isEarned ? "text-blue-200" : "text-gray-500"
            }`}
          >
            {certificate.category}
          </p>

          <h3
            className={`mt-2 text-xl font-bold ${
              isEarned ? "text-white" : "text-gray-900"
            }`}
          >
            {certificate.title}
          </h3>

          <div
            className={`mt-3 flex items-center gap-2 text-sm ${
              isEarned ? "text-blue-100" : "text-gray-500"
            }`}
          >
            <Users size={15} />
            <span>Instructor: {certificate.instructor}</span>
          </div>
        </div>
      </div>

      {/* DETAILS */}
      <div className="p-6">
        {isEarned ? (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DetailItem
                icon={Calendar}
                label="Issue Date"
                value={formatLong(certificate.issueDate)}
              />

              <DetailItem
                icon={Clock}
                label="Course Duration"
                value={certificate.duration}
              />

              <DetailItem
                icon={Layers}
                label="Lessons Completed"
                value={`${certificate.totalLessons} lessons`}
              />

              <DetailItem
                icon={FileBadge}
                label="Certificate ID"
                value={certificate.certificateCode}
              />
            </div>

            {!certificate.signed && (
              <div className="mt-5 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />
                Awaiting instructor signature. Download will be available once
                it is signed.
              </div>
            )}

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onView}
                className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#B00000] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
              >
                <Eye size={17} />
                View Certificate
              </button>

              <button
                type="button"
                onClick={onDownload}
                disabled={!certificate.signed}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Download size={17} />
                Download
              </button>

              <button
                type="button"
                onClick={share}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                <Share2 size={17} />
                Share
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Course progress
                </p>

                <p className="mt-1 text-2xl font-bold text-gray-900">
                  {certificate.completion}%
                </p>
              </div>

              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#1E3A8A]">
                <BookOpen size={22} />
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-500">Completion</span>

                <span className="font-semibold text-[#1E3A8A]">
                  {certificate.completion}%
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-[#1E3A8A] transition-all"
                  style={{
                    width: `${certificate.completion}%`,
                  }}
                />
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem
                icon={Clock}
                label="Course Duration"
                value={certificate.duration}
              />

              <DetailItem
                icon={Users}
                label="Instructor"
                value={certificate.instructor}
              />
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  `/dashboard/student/courses/${certificate.courseId}/learn`,
                )
              }
              className="mt-6 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#1E3A8A] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#172f70]"
            >
              <BookOpen size={17} />
              Continue Course
            </button>
          </>
        )}
      </div>
    </div>
  );
};

/* -------------------------------- */
/* DETAIL ITEM */
/* -------------------------------- */

const DetailItem = ({ icon: Icon, label, value }) => {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={15} />
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 truncate text-sm font-semibold text-gray-700">
          {value}
        </p>
      </div>
    </div>
  );
};

/* -------------------------------- */
/* EMPTY STATE */
/* -------------------------------- */

const EmptyState = ({ hasCourses }) => {
  return (
    <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <XCircle size={30} />
      </div>

      <h3 className="mt-5 text-lg font-bold text-gray-900">
        No certificates found
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
        {hasCourses
          ? "We couldn't find any certificates matching your current search or filter."
          : "Enrol in a course and complete all its lessons to earn your first certificate."}
      </p>
    </div>
  );
};

export default Certificates;
