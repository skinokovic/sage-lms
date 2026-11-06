import { Link } from "react-router-dom";
import { Briefcase, Heart, MapPin, Sprout, Users } from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import FeatureCard from "../components/FeatureCard";
import CtaBand from "../components/CtaBand";

/*
  Add open roles here. Leave the array empty to show the
  "no open roles" message instead.

  { title: "Course Operations Associate", type: "Full-time",
    location: "Port Harcourt / Hybrid",
    summary: "One or two sentences about the role.",
    to: "/contact" }          // where "Apply" should send people
*/
const OPENINGS = [];

const PERKS = [
  {
    icon: <Heart size={24} className="text-primary" />,
    bgClassName: "bg-red-50",
    title: "Work that matters",
    description:
      "Help working professionals build skills that change their careers.",
  },
  {
    icon: <Sprout size={24} className="text-emerald-600" />,
    bgClassName: "bg-emerald-50",
    title: "Room to grow",
    description:
      "Take ownership early and learn across teaching, product and operations.",
  },
  {
    icon: <Users size={24} className="text-secondary" />,
    bgClassName: "bg-blue-50",
    title: "A supportive team",
    description:
      "Small teams, direct feedback and people who share what they know.",
  },
];

export default function Careers() {
  return (
    <PublicPageLayout
      eyebrow="Careers"
      title="Help us make practical business education accessible"
      subtitle="We’re building a platform that helps professionals learn faster. If that sounds like your kind of work, we’d like to hear from you."
    >
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Why work with SAGE
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {PERKS.map((perk) => (
            <FeatureCard key={perk.title} {...perk} />
          ))}
        </div>
      </section>

      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-4xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Open positions
          </h2>

          {OPENINGS.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-primary">
                <Briefcase size={22} />
              </div>
              <p className="mt-4 text-base font-semibold text-gray-900">
                We don’t have any open roles right now
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                New positions are posted here as soon as they open. You can
                still introduce yourself, and we’ll keep your details in mind.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
                >
                  Introduce yourself
                </Link>
                <Link
                  to="/become-instructor"
                  className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
                >
                  Teach on SAGE
                </Link>
              </div>
            </div>
          ) : (
            <ul className="mt-6 space-y-4">
              {OPENINGS.map((job) => (
                <li
                  key={job.title}
                  className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-gray-900">
                      {job.title}
                    </h3>
                    <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Briefcase size={13} />
                        {job.type}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MapPin size={13} />
                        {job.location}
                      </span>
                    </p>
                    {job.summary && (
                      <p className="mt-2 text-sm leading-6 text-gray-600">
                        {job.summary}
                      </p>
                    )}
                  </div>

                  <Link
                    to={job.to || "/contact"}
                    className="inline-flex shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-hover"
                  >
                    Apply
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <CtaBand
        title="Not sure where you’d fit?"
        text="Tell us about your experience and what you’d like to work on."
        primary={{ to: "/contact", label: "Get in touch" }}
      />
    </PublicPageLayout>
  );
}
