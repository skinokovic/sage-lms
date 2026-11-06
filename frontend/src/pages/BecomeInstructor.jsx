import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowRight,
  Award,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  Clock3,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { toast } from "react-toastify";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { instructorApplicationApi } from "../api/instructorApplicationApi";

const initialForm = {
  professionalTitle: "",
  expertise: "",
  yearsOfExperience: "",
  organization: "",
  courseCategory: "",
  teachingExperience: "",
  motivation: "",
  linkedinUrl: "",
  websiteUrl: "",
};

const categories = [
  "Marketing",
  "Finance",
  "Accounting",
  "Product Development",
  "Retail Management",
  "Leadership & HR",
  "Technology & Software",
  "Industrial Automation",
  "Process Control & Instrumentation",
  "Other",
];

const statusCopy = {
  pending: {
    title: "Application submitted",
    text: "Your application is waiting for an admin review.",
    className: "border-amber-200 bg-amber-50 text-amber-800",
  },
  under_review: {
    title: "Application under review",
    text: "An admin is currently reviewing your instructor application.",
    className: "border-blue-200 bg-blue-50 text-blue-800",
  },
  approved: {
    title: "You're now an instructor",
    text: "Your application has been approved. You can now access the instructor workspace.",
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  rejected: {
    title: "Application needs another submission",
    text: "Your previous application was not approved. Review the feedback below and submit again.",
    className: "border-red-200 bg-red-50 text-red-800",
  },
};

const getDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function BecomeInstructor() {
  const { user } = useSelector((state) => state.auth);
  const [application, setApplication] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const isInstructor = user?.role === "instructor";
  const isAdmin = user?.role === "admin";

  const canApply = !application || application.status === "rejected";

  const status = useMemo(
    () => (application ? statusCopy[application.status] : null),
    [application],
  );

  useEffect(() => {
    let mounted = true;

    const loadApplication = async () => {
      try {
        const { data } = await instructorApplicationApi.mine();
        if (mounted) setApplication(data.application || null);
      } catch (error) {
        if (error.response?.status !== 404) {
          toast.error(
            error.response?.data?.message ||
              "Unable to load your instructor application.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadApplication();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!application || application.status !== "rejected") return;

    setForm({
      professionalTitle: application.professionalTitle || "",
      expertise: application.expertise || "",
      yearsOfExperience: application.yearsOfExperience ?? "",
      organization: application.organization || "",
      courseCategory: application.courseCategory || "",
      teachingExperience: application.teachingExperience || "",
      motivation: application.motivation || "",
      linkedinUrl: application.linkedinUrl || "",
      websiteUrl: application.websiteUrl || "",
    });
  }, [application]);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.courseCategory) {
      toast.error("Please select the category you want to teach.");
      return;
    }

    if (Number(form.yearsOfExperience) < 0) {
      toast.error("Years of experience cannot be negative.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience),
      };

      const { data } = await instructorApplicationApi.create(payload);
      setApplication(data.application);
      toast.success(
        data.message || "Your instructor application has been submitted.",
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to submit your application. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (isInstructor || isAdmin) {
    return (
      <div className="min-h-screen bg-surface">
        <Navbar />
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:py-24">
          <div className="rounded-3xl border border-line bg-surface p-8 text-center shadow-sm sm:p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 size={34} />
            </div>
            <h1 className="mt-6 text-2xl font-extrabold text-heading sm:text-3xl">
              {isInstructor
                ? "You are already an instructor"
                : "Instructor management is available to admins"}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-body sm:text-base">
              {isInstructor
                ? "Your instructor workspace is ready. Continue building courses and supporting your learners."
                : "Use the admin workspace to review and manage instructor applications."}
            </p>
            <Link
              to={isInstructor ? "/dashboard/instructor" : "/dashboard/admin"}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Go to dashboard <ArrowRight size={17} />
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      <section className="relative overflow-hidden bg-secondary text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 ring-1 ring-white/10">
              <Sparkles size={14} /> Teach with SAGE
            </div>
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
              Share what you know. Help others grow.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
              Become a SAGE instructor and turn your professional knowledge,
              practical experience and teaching skills into learning experiences
              for motivated students.
            </p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [Users, "Reach learners", "Build a learning community"],
              [BookOpenIcon, "Create courses", "Teach what you know"],
              [Award, "Build credibility", "Grow your professional profile"],
              [
                BriefcaseBusiness,
                "Teach professionally",
                "Manage your own classes",
              ],
            ].map(([Icon, title, text]) => (
              <div
                key={title}
                className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur"
              >
                <Icon size={20} />
                <p className="mt-3 text-sm font-bold">{title}</p>
                <p className="mt-1 text-xs leading-5 text-blue-200">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <div className="h-[560px] animate-pulse rounded-3xl bg-surface-muted" />
            <div className="h-72 animate-pulse rounded-3xl bg-surface-muted" />
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <div>
              {application && status && (
                <div
                  className={`mb-6 rounded-2xl border p-5 ${status.className}`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle2 size={21} className="mt-0.5 shrink-0" />
                    <div>
                      <p className="font-extrabold">{status.title}</p>
                      <p className="mt-1 text-sm leading-6 opacity-90">
                        {status.text}
                      </p>
                      <p className="mt-2 text-xs font-semibold opacity-80">
                        Submitted: {getDate(application.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {application?.status === "approved" ? (
                <div className="rounded-3xl border border-emerald-200 bg-white p-7 shadow-sm sm:p-10">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                    <GraduationCap size={30} />
                  </div>
                  <h2 className="mt-5 text-2xl font-extrabold text-heading">
                    Welcome to the SAGE instructor community
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-body">
                    Your application has been approved. Your account has been
                    upgraded to the instructor role and you can now manage your
                    teaching workspace.
                  </p>
                  <Link
                    to="/dashboard/instructor"
                    className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
                  >
                    Open instructor dashboard <ArrowRight size={17} />
                  </Link>
                </div>
              ) : !canApply ? (
                <div className="rounded-3xl border border-line bg-surface p-7 shadow-sm sm:p-10">
                  <Clock3 className="text-secondary" size={30} />
                  <h2 className="mt-5 text-2xl font-extrabold text-heading">
                    Your application is being processed
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-body">
                    You do not need to submit another application while your
                    current application is pending or under review.
                  </p>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-8"
                >
                  <div className="border-b border-line pb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                      Instructor application
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold text-heading">
                      Tell us about your expertise
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-body">
                      Provide enough information for the SAGE team to understand
                      your professional background and what you would like to
                      teach.
                    </p>
                  </div>

                  {application?.status === "rejected" &&
                    application.adminNotes && (
                      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                        <p className="font-bold">Admin feedback</p>
                        <p className="mt-1 leading-6">
                          {application.adminNotes}
                        </p>
                      </div>
                    )}

                  <div className="mt-7 space-y-8">
                    <section>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-heading">
                        Professional information
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Professional title" required>
                          <input
                            name="professionalTitle"
                            value={form.professionalTitle}
                            onChange={updateField}
                            required
                            placeholder="e.g. Senior Software Engineer"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                        <Field label="Area of expertise" required>
                          <input
                            name="expertise"
                            value={form.expertise}
                            onChange={updateField}
                            required
                            placeholder="e.g. Full-Stack Development"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                        <Field label="Years of experience" required>
                          <input
                            name="yearsOfExperience"
                            type="number"
                            min="0"
                            value={form.yearsOfExperience}
                            onChange={updateField}
                            required
                            placeholder="e.g. 5"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                        <Field label="Current organization">
                          <input
                            name="organization"
                            value={form.organization}
                            onChange={updateField}
                            placeholder="Company / organization"
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-heading">
                        Teaching information
                      </h3>
                      <div className="mt-4 space-y-4">
                        <Field label="Preferred course category" required>
                          <select
                            name="courseCategory"
                            value={form.courseCategory}
                            onChange={updateField}
                            required
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          >
                            <option value="">Select a category</option>
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="Teaching / training experience" required>
                          <textarea
                            name="teachingExperience"
                            value={form.teachingExperience}
                            onChange={updateField}
                            required
                            rows={4}
                            placeholder="Tell us about your previous teaching, mentoring, coaching or training experience."
                            className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                        <Field
                          label="Why do you want to become an instructor?"
                          required
                        >
                          <textarea
                            name="motivation"
                            value={form.motivation}
                            onChange={updateField}
                            required
                            rows={4}
                            placeholder="Tell us what you would like to contribute to the SAGE learning community."
                            className="w-full resize-y rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-sm font-extrabold uppercase tracking-wider text-heading">
                        Professional links
                      </h3>
                      <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="LinkedIn profile">
                          <input
                            name="linkedinUrl"
                            type="url"
                            value={form.linkedinUrl}
                            onChange={updateField}
                            placeholder="https://linkedin.com/in/..."
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                        <Field label="Website / portfolio">
                          <input
                            name="websiteUrl"
                            type="url"
                            value={form.websiteUrl}
                            onChange={updateField}
                            placeholder="https://..."
                            className="w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-heading outline-none transition placeholder:text-body/60 focus:border-primary focus:ring-2 focus:ring-primary/10"
                          />
                        </Field>
                      </div>
                    </section>
                  </div>

                  <div className="mt-8 border-t border-line pt-6">
                    <div className="flex items-start gap-3 rounded-xl bg-surface-muted p-4 text-xs leading-5 text-body">
                      <ShieldCheck
                        size={17}
                        className="mt-0.5 shrink-0 text-secondary"
                      />
                      <p>
                        By submitting this application, you confirm that the
                        information provided is accurate. An admin will review
                        your application before instructor access is granted.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                    >
                      {submitting
                        ? "Submitting application..."
                        : "Submit application"}
                      {!submitting && <ArrowRight size={17} />}
                    </button>
                  </div>
                </form>
              )}
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <div className="rounded-3xl border border-line bg-surface p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  How it works
                </p>
                <div className="mt-5 space-y-5">
                  {[
                    [
                      "01",
                      "Submit your application",
                      "Tell us about your experience and what you want to teach.",
                    ],
                    [
                      "02",
                      "SAGE reviews it",
                      "An admin checks your application and professional background.",
                    ],
                    [
                      "03",
                      "Get approved",
                      "Approved applicants receive instructor access.",
                    ],
                    [
                      "04",
                      "Start teaching",
                      "Build courses, manage learners and teach from your dashboard.",
                    ],
                  ].map(([number, title, text]) => (
                    <div key={number} className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-xs font-extrabold text-primary">
                        {number}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-heading">
                          {title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-body">
                          {text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-secondary p-6 text-white">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                  <ShieldCheck size={22} />
                </div>
                <h3 className="mt-4 font-extrabold">Quality matters at SAGE</h3>
                <p className="mt-2 text-sm leading-6 text-blue-100">
                  Instructor access is reviewed so learners can find practical,
                  credible and useful learning experiences.
                </p>
                <div className="mt-5 space-y-2 text-xs text-blue-100">
                  <p className="flex items-center gap-2">
                    <Check size={15} /> Admin-reviewed applications
                  </p>
                  <p className="flex items-center gap-2">
                    <Check size={15} /> Professional teaching workspace
                  </p>
                  <p className="flex items-center gap-2">
                    <Check size={15} /> Course and learner tools
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-heading">
        {label} {required && <span className="text-primary">*</span>}
      </span>
      {children}
    </label>
  );
}

function BookOpenIcon(props) {
  return <GraduationCap {...props} />;
}
