import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, GraduationCap, MapPin, Star } from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import CtaBand from "../components/CtaBand";
import InstructorReviewsModal from "../components/reviews/InstructorReviewsModal";
import { publicApi } from "../api/publicApi";

const initialsOf = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("") || "S";

function Avatar({ name, src }) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className="h-20 w-20 rounded-full object-cover ring-4 ring-white shadow-md"
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary text-xl font-bold text-white ring-4 ring-white shadow-md"
    >
      {initialsOf(name)}
    </div>
  );
}

function InstructorCard({ instructor, onShowReviews }) {
  const {
    name,
    avatarUrl,
    specialization,
    bio,
    experience,
    qualification,
    location,
    rating,
    reviews,
    courses,
  } = instructor;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-4">
        <Avatar name={name} src={avatarUrl} />
        <div className="min-w-0">
          <h3 className="truncate text-lg font-bold text-gray-900">{name}</h3>
          {specialization && (
            <p className="mt-0.5 text-sm font-medium text-primary">
              {specialization}
            </p>
          )}
        </div>
      </div>

      {bio && (
        <p className="mt-4 line-clamp-4 text-sm leading-6 text-gray-600">
          {bio}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-2 text-xs text-gray-600">
        {experience && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
            <GraduationCap size={13} className="text-secondary" />
            {experience}
          </span>
        )}
        {location && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-1.5">
            <MapPin size={13} className="text-secondary" />
            {location}
          </span>
        )}
      </div>

      {qualification && (
        <p className="mt-3 text-xs text-gray-500">{qualification}</p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-4 text-sm text-gray-600">
        <span className="inline-flex items-center gap-1.5">
          <BookOpen size={15} className="text-primary" />
          {courses} {courses === 1 ? "course" : "courses"}
        </span>

        {reviews > 0 ? (
          <button
            type="button"
            onClick={() => onShowReviews(instructor)}
            aria-label={`Read ${reviews} reviews of ${name}`}
            className="inline-flex cursor-pointer items-center gap-1.5 font-semibold text-gray-900 hover:text-primary"
          >
            <Star size={15} className="fill-amber-400 text-amber-400" />
            {Number(rating).toFixed(1)}
            <span className="font-normal text-gray-500 underline-offset-2 hover:underline">
              ({reviews})
            </span>
          </button>
        ) : (
          <span className="text-xs text-gray-400">No reviews yet</span>
        )}
      </div>
    </article>
  );
}

export default function OurInstructors() {
  const [reviewing, setReviewing] = useState(null);
  const [state, setState] = useState({
    loading: true,
    error: "",
    instructors: [],
  });

  useEffect(() => {
    let cancelled = false;

    publicApi
      .instructors()
      .then(({ data }) => {
        if (!cancelled) {
          setState({
            loading: false,
            error: "",
            instructors: data.instructors || [],
          });
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            loading: false,
            error:
              err.response?.data?.message ||
              "We couldn’t load our instructors. Please refresh the page.",
            instructors: [],
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { loading, error, instructors } = state;

  return (
    <PublicPageLayout
      eyebrow="Our instructors"
      title="Learn from people who have done the work"
      subtitle="Every SAGE course is taught by an experienced professional. Meet the instructors behind the platform."
    >
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-2xl border border-gray-100 p-6"
              >
                <div className="flex items-center gap-4">
                  <div className="h-20 w-20 rounded-full bg-gray-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-gray-100" />
                    <div className="h-3 w-1/2 rounded bg-gray-100" />
                  </div>
                </div>
                <div className="mt-5 space-y-2">
                  <div className="h-3 rounded bg-gray-100" />
                  <div className="h-3 rounded bg-gray-100" />
                  <div className="h-3 w-3/4 rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mx-auto max-w-md rounded-2xl border border-red-100 bg-red-50 p-6 text-center text-sm text-red-700"
          >
            {error}
          </div>
        ) : instructors.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-gray-50 p-8 text-center">
            <p className="text-base font-semibold text-gray-900">
              Our instructor profiles are coming soon
            </p>
            <p className="mt-2 text-sm text-gray-500">
              In the meantime, explore the courses available right now.
            </p>
            <Link
              to="/courses"
              className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {instructors.map((instructor) => (
              <InstructorCard
                key={instructor.id}
                instructor={instructor}
                onShowReviews={setReviewing}
              />
            ))}
          </div>
        )}
      </section>

      {reviewing && (
        <InstructorReviewsModal
          instructor={reviewing}
          onClose={() => setReviewing(null)}
        />
      )}

      <CtaBand
        title="Have expertise to share?"
        text="Apply to teach on SAGE and reach learners who want practical, career-focused skills."
        primary={{ to: "/become-instructor", label: "Become an instructor" }}
        secondary={{ to: "/courses", label: "Browse courses" }}
      />
    </PublicPageLayout>
  );
}
