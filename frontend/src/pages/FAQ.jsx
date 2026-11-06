import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";

import PublicPageLayout from "../components/PublicPageLayout";
import CtaBand from "../components/CtaBand";

const FAQS = [
  {
    q: "How do I enrol in a course?",
    a: "Open any course, add it to your cart and check out. Once your payment is confirmed, the course appears in your student dashboard and you can start learning straight away.",
  },
  {
    q: "Which payment methods can I use?",
    a: "You can pay online at checkout or choose bank transfer. Bank transfers are confirmed by our team before the course is unlocked, so allow a little extra time for those.",
  },
  {
    q: "Do I need an account to browse courses?",
    a: "No. You can browse courses, read what they cover and see the prices without signing in. You’ll need a free account to enrol and track your progress.",
  },
  {
    q: "Can I learn at my own pace?",
    a: "Yes. Lessons are available whenever you’re ready, on any device, and your dashboard remembers which lessons you’ve completed so you can continue where you stopped.",
  },
  {
    q: "How do certificates work?",
    a: "When you complete every lesson in a course, you can download a certificate from your dashboard. Each certificate carries a code that anyone can check on our verification page.",
  },
  {
    q: "How can someone verify my certificate?",
    a: "Share your certificate code with them and ask them to enter it on the Verify page. They’ll see whether the certificate is genuine and who it was issued to.",
    link: { to: "/verify", label: "Go to certificate verification" },
  },
  {
    q: "I forgot my password. What should I do?",
    a: "Use the “Forgot password” link on the login page and enter your email address. We’ll send you a link to choose a new password.",
    link: { to: "/forgot-password", label: "Reset my password" },
  },
  {
    q: "How can I teach on SAGE?",
    a: "Create an account and submit an instructor application. Our team reviews every application, and approved instructors can build and publish their own courses.",
    link: { to: "/become-instructor", label: "Apply to become an instructor" },
  },
];

function FaqItem({ item, open, onToggle, id }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          id={`${id}-button`}
          className="flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left text-sm font-semibold text-gray-900 transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40 sm:px-6 sm:py-5 sm:text-base"
        >
          {item.q}
          <ChevronDown
            size={20}
            className={`shrink-0 text-gray-400 transition-transform duration-200 ${
              open ? "rotate-180 text-primary" : ""
            }`}
          />
        </button>
      </h3>

      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-button`}
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 text-sm leading-7 text-gray-600 sm:px-6">
            <p>{item.a}</p>
            {item.link && (
              <Link
                to={item.link.to}
                className="mt-3 inline-block font-semibold text-primary hover:underline"
              >
                {item.link.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <PublicPageLayout
      eyebrow="FAQs"
      title="Frequently asked questions"
      subtitle="Quick answers about enrolling, paying, learning and certificates."
    >
      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="space-y-3">
          {FAQS.map((item, index) => (
            <FaqItem
              key={item.q}
              id={`faq-${index}`}
              item={item}
              open={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? -1 : index)}
            />
          ))}
        </div>
      </section>

      <CtaBand
        title="Can’t find your answer?"
        text="Send us a message and we’ll help you out."
        primary={{ to: "/contact", label: "Contact us" }}
      />
    </PublicPageLayout>
  );
}
