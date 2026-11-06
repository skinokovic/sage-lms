import { Link } from "react-router-dom";
import {
  Award,
  BadgeCheck,
  BookOpen,
  CheckCircle2,
  Clock,
  Compass,
  Users,
} from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import FeatureCard from "../components/FeatureCard";
import CtaBand from "../components/CtaBand";

const VALUES = [
  {
    icon: <Compass size={24} className="text-primary" />,
    bgClassName: "bg-red-50",
    title: "Practical first",
    description:
      "Every course is built around skills you can use at work the following week.",
  },
  {
    icon: <Users size={24} className="text-secondary" />,
    bgClassName: "bg-blue-50",
    title: "Taught by practitioners",
    description:
      "Our instructors teach from real business experience, not just theory.",
  },
  {
    icon: <Clock size={24} className="text-amber-600" />,
    bgClassName: "bg-amber-50",
    title: "Built around your schedule",
    description:
      "Learn on any device and pick up exactly where you stopped.",
  },
  {
    icon: <Award size={24} className="text-emerald-600" />,
    bgClassName: "bg-emerald-50",
    title: "Proof of what you learned",
    description:
      "Finish a course and earn a certificate that anyone can verify online.",
  },
];

const STEPS = [
  {
    title: "Find your course",
    text: "Browse the catalogue by category and level, and read what each course covers before you enrol.",
  },
  {
    title: "Learn at your own pace",
    text: "Work through video lessons, readings and assignments. Your dashboard tracks every lesson you complete.",
  },
  {
    title: "Earn your certificate",
    text: "Complete the course and download a certificate. Employers can check it on our verification page.",
  },
];

const INCLUDED = [
  "Structured, career-focused courses",
  "Progress tracking from your dashboard",
  "Assignments with instructor feedback",
  "Certificates you can verify online",
];

export default function About() {
  return (
    <PublicPageLayout
      eyebrow="About the platform"
      title="Business education that fits around your working life"
      subtitle="SAGE School of Business & Management gives working professionals a practical way to build skills, with expert-led courses they can take from anywhere."
    >
      {/* Story */}
      <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-16">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Why we built SAGE
          </h2>
          <div className="mt-5 space-y-4 text-sm leading-7 text-gray-600 sm:text-base">
            <p>
              Most professionals can’t pause their careers to go back to a
              classroom. They need learning that is relevant, flexible and
              credible, delivered by people who have done the work.
            </p>
            <p>
              SAGE brings structured courses, experienced instructors and
              verifiable certificates together in one place, so you can invest
              your limited time in skills that move your career forward.
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/courses"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-hover"
            >
              <BookOpen size={17} />
              Browse courses
            </Link>
            <Link
              to="/instructors"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-50"
            >
              Meet our instructors
            </Link>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <BadgeCheck size={22} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              What you get with SAGE
            </h3>
          </div>

          <ul className="mt-6 space-y-3">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2
                  size={18}
                  className="mt-0.5 shrink-0 text-emerald-600"
                />
                <span className="text-sm text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#F8FAFC]">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
          <div className="mb-8 max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              What we stand for
            </h2>
            <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base">
              The principles behind every course on the platform.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value) => (
              <FeatureCard key={value.title} {...value} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-8 max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            How learning works here
          </h2>
        </div>

        <ol className="grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li
              key={step.title}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold text-gray-900">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                {step.text}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <CtaBand
        title="Start building skills that move your career forward"
        text="Create a free account, explore the courses and learn at your own pace."
        primary={{ to: "/create-account", label: "Create free account" }}
        secondary={{ to: "/courses", label: "Browse courses" }}
      />
    </PublicPageLayout>
  );
}
