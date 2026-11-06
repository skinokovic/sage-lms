import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Award, BookOpen, Clock, ShieldCheck, Wallet } from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import FeatureCard from "../components/FeatureCard";
import CtaBand from "../components/CtaBand";
import { fetchPublishedCourses } from "../store/courseSlice";

// Change this if your checkout charges in another currency.
const CURRENCY = "NGN";

const formatPrice = (amount) =>
  Number(amount) > 0
    ? new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: CURRENCY,
        maximumFractionDigits: 0,
      }).format(amount)
    : "Free";

const SORTERS = {
  newest: (a, b) =>
    new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
  low: (a, b) => a.price - b.price,
  high: (a, b) => b.price - a.price,
};

const POINTS = [
  {
    icon: <Wallet size={24} className="text-primary" />,
    bgClassName: "bg-red-50",
    title: "Pay per course",
    description:
      "Each course has its own price. Pay only for what you want to learn.",
  },
  {
    icon: <ShieldCheck size={24} className="text-secondary" />,
    bgClassName: "bg-blue-50",
    title: "Secure checkout",
    description:
      "Pay online at checkout, or choose bank transfer if you prefer.",
  },
  {
    icon: <Award size={24} className="text-emerald-600" />,
    bgClassName: "bg-emerald-50",
    title: "Certificate on completion",
    description:
      "Finish the course and earn a certificate you can share and verify.",
  },
];

export default function Pricing() {
  const dispatch = useDispatch();
  const { publishedItems = [], publishedStatus = "idle" } = useSelector(
    (state) => state.courses,
  );
  const [sort, setSort] = useState("newest");

  useEffect(() => {
    if (publishedStatus === "idle") dispatch(fetchPublishedCourses());
  }, [dispatch, publishedStatus]);

  const loading = publishedStatus === "idle" || publishedStatus === "loading";

  const courses = useMemo(
    () => [...publishedItems].sort(SORTERS[sort]),
    [publishedItems, sort],
  );

  return (
    <PublicPageLayout
      eyebrow="Pricing"
      title="Simple pricing, one course at a time"
      subtitle="No subscriptions to manage. Choose a course, see the price up front, and start learning."
    >
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {POINTS.map((point) => (
            <FeatureCard key={point.title} {...point} />
          ))}
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Course prices
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Every price shown is the full cost of the course.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="price-sort" className="text-sm text-gray-600">
                Sort by
              </label>
              <select
                id="price-sort"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              >
                <option value="newest">Newest</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-2xl border border-gray-100 bg-white"
                >
                  <div className="aspect-[16/10] bg-gray-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-4 w-3/4 rounded bg-gray-100" />
                    <div className="h-4 w-1/2 rounded bg-gray-100" />
                    <div className="h-8 w-1/3 rounded bg-gray-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center">
              <p className="text-base font-semibold text-gray-900">
                Courses will be listed here soon
              </p>
              <p className="mt-2 text-sm text-gray-500">
                Check back shortly, or contact us if you have a question.
              </p>
              <Link
                to="/contact"
                className="mt-5 inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
              >
                Contact us
              </Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <article
                  key={course.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  <div className="aspect-[16/10] bg-gray-100">
                    {course.image ? (
                      <img
                        src={course.image}
                        alt={course.title}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-gray-300">
                        <BookOpen size={36} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    {course.category && (
                      <span className="w-fit rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-secondary">
                        {course.category}
                      </span>
                    )}

                    <h3 className="mt-3 line-clamp-2 text-base font-bold leading-snug text-gray-900">
                      {course.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {course.instructorName}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                      {course.level && <span>{course.level}</span>}
                      {course.duration && (
                        <span className="inline-flex items-center gap-1">
                          <Clock size={12} />
                          {course.duration}
                        </span>
                      )}
                    </div>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-5">
                      <p className="text-xl font-extrabold text-gray-900">
                        {formatPrice(course.price)}
                      </p>
                      <Link
                        to={`/courses/${course.id}`}
                        className="rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
                      >
                        View course
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <CtaBand
        title="Questions about paying or enrolling?"
        text="Our FAQs cover payments, certificates and accessing your courses."
        primary={{ to: "/faq", label: "Read the FAQs" }}
        secondary={{ to: "/contact", label: "Contact us" }}
      />
    </PublicPageLayout>
  );
}
