import { ArrowRight, GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useSelector } from "react-redux";

export default function BecomeInstructorCTA() {
  const { user } = useSelector((state) => state.auth);

  if (user?.role === "instructor" || user?.role === "admin") {
    return null;
  }

  return (
    <section className="relative mt-12 overflow-hidden rounded-3xl bg-secondary px-5 py-8 text-white shadow-sm sm:px-8 sm:py-10 lg:px-10">
      <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-white/5 blur-3xl" />
      <div className="absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />

      <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-blue-100 ring-1 ring-white/10">
            <Sparkles size={14} /> Teach with SAGE
          </div>
          <h2 className="mt-4 text-2xl font-extrabold tracking-tight sm:text-3xl">
            Share your knowledge with the next generation of learners.
          </h2>
          <p className="mt-3 text-sm leading-6 text-blue-100 sm:text-base">
            If you have professional knowledge or practical experience to teach,
            apply to become a SAGE instructor and build meaningful courses.
          </p>

          <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-blue-100">
            <span className="inline-flex items-center gap-2">
              <GraduationCap size={15} /> Create courses
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck size={15} /> Admin reviewed
            </span>
          </div>
        </div>

        {user ? (
          <Link
            to="/become-instructor"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-primary-hover"
          >
            Become an instructor
            <ArrowRight size={17} />
          </Link>
        ) : (
          <Link
            to="/login?redirect=/become-instructor"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-bold text-secondary shadow-lg transition hover:bg-blue-50"
          >
            Sign in to apply
            <ArrowRight size={17} />
          </Link>
        )}
      </div>
    </section>
  );
}
