import { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

/**
 * Shared shell for the public info pages: Navbar, a hero that matches the
 * Homepage styling, the page content, and the Footer.
 */
export default function PublicPageLayout({
  eyebrow,
  title,
  subtitle,
  children,
}) {
  // Footer links keep the old scroll position on route change, so reset it.
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="relative overflow-hidden bg-[#F8FAFC]">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-blue-100/60 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-5 py-12 text-center sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          {eyebrow && (
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
          )}

          <h1 className="mx-auto max-w-3xl text-3xl font-extrabold leading-tight tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
            {title}
          </h1>

          <div className="mx-auto mt-5 h-1.5 w-16 rounded-full bg-secondary" />

          {subtitle && (
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-gray-600 sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </section>

      {children}

      <Footer />
    </div>
  );
}
