import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Facebook, Twitter, Instagram, Linkedin, Loader2 } from "lucide-react";
import Logo from "./Logo";
import { fetchPublishedCourses } from "../store/courseSlice";
import { publicApi } from "../api/publicApi";

// TODO: replace the "#" values with your real social profile URLs.
const SOCIAL_LINKS = [
  { label: "Facebook", Icon: Facebook, href: "www.facebook.com" },
  { label: "Twitter", Icon: Twitter, href: "www.x.com" },
  { label: "Instagram", Icon: Instagram, href: "www.instagram.com" },
  { label: "LinkedIn", Icon: Linkedin, href: "www.linkedin.com" },
];

const ABOUT_SAGE = [
  { label: "About the Platform", to: "/about" },
  { label: "Our Instructors", to: "/instructors" },
  { label: "Careers", to: "/careers" },
  { label: "Contact Us", to: "/contact" },
];

const DISCOVER_MORE = [
  { label: "Browse Courses", to: "/courses" },
  { label: "Become an Instructor", to: "/become-instructor" },
  { label: "Pricing", to: "/pricing" },
  { label: "FAQs", to: "/faq" },
];

const FOOTER_COURSE_COUNT = 4;

const byNewest = (a, b) =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

/**
 * Site-wide footer. The Certified Courses column lists the newest published
 * courses, and the newsletter form saves subscribers to the backend.
 */
export default function Footer() {
  const dispatch = useDispatch();

  const { publishedItems = [], publishedStatus = "idle" } = useSelector(
    (state) => state.courses,
  );

  useEffect(() => {
    if (publishedStatus === "idle") dispatch(fetchPublishedCourses());
  }, [dispatch, publishedStatus]);

  const footerCourses = useMemo(
    () => [...publishedItems].sort(byNewest).slice(0, FOOTER_COURSE_COUNT),
    [publishedItems],
  );

  const loadingCourses =
    publishedStatus === "idle" || publishedStatus === "loading";

  const [email, setEmail] = useState("");
  const [subscribe, setSubscribe] = useState({ status: "idle", message: "" });

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || subscribe.status === "loading") return;

    setSubscribe({ status: "loading", message: "" });

    try {
      const { data } = await publicApi.subscribe(value);
      setEmail("");
      setSubscribe({
        status: "success",
        message: data.message || "Thanks — you’re subscribed!",
      });
    } catch (err) {
      setSubscribe({
        status: "error",
        message:
          err.response?.data?.message ||
          "Couldn’t subscribe right now. Please try again.",
      });
    }
  };

  return (
    <footer className="bg-blue-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-6 lg:gap-x-8">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <Logo variant="light" size={40} />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-white/70">
              SAGE School of Business &amp; Management helps working
              professionals build real-world business skills through practical,
              expert-led courses.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {SOCIAL_LINKS.map(({ label, Icon, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Certified Courses (live from the database) */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Certified Courses
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
              {loadingCourses ? (
                [0, 1, 2, 3].map((item) => (
                  <li
                    key={item}
                    className="h-4 w-4/5 animate-pulse rounded bg-white/10"
                  />
                ))
              ) : footerCourses.length > 0 ? (
                footerCourses.map((course) => (
                  <li key={course.id}>
                    <Link
                      to={`/courses/${course.id}`}
                      className="line-clamp-2 leading-snug transition-colors hover:text-white"
                    >
                      {course.title}
                    </Link>
                  </li>
                ))
              ) : (
                <li>
                  <Link
                    to="/courses"
                    className="transition-colors hover:text-white"
                  >
                    Browse all courses
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* About Sage */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              About Sage
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
              {ABOUT_SAGE.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Discover More */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Discover More
            </h3>
            <ul className="mt-4 flex flex-col gap-2.5 text-sm text-white/70">
              {DISCOVER_MORE.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <h3 className="text-sm font-bold uppercase tracking-wide text-white">
              Stay Updated
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-white/70">
              Get new course drops and career tips straight to your inbox.
            </p>
            <form
              onSubmit={handleSubscribe}
              className="mt-4 flex flex-col gap-2 sm:flex-row lg:flex-col"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                aria-label="Email address"
                className="w-full min-w-0 rounded-control border border-white/20 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
              />
              <button
                type="submit"
                disabled={subscribe.status === "loading"}
                className="inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {subscribe.status === "loading" && (
                  <Loader2 size={15} className="animate-spin" />
                )}
                {subscribe.status === "loading" ? "Subscribing…" : "Subscribe"}
              </button>
            </form>
            {subscribe.status === "success" && (
              <p className="mt-2 text-xs text-emerald-300" role="status">
                {subscribe.message}
              </p>
            )}
            {subscribe.status === "error" && (
              <p className="mt-2 text-xs text-red-300" role="alert">
                {subscribe.message}
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="text-xs text-white/60">
            &copy; {new Date().getFullYear()} SAGE School Of Business &amp;
            Management. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-xs text-white/60">
            <Link
              to="/privacy-policy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="transition-colors hover:text-white"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
