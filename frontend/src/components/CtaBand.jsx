import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

/**
 * Red call-to-action band, same look as the Homepage's final CTA.
 * primary / secondary: { to, label }
 */
export default function CtaBand({ title, text, primary, secondary }) {
  return (
    <section className="px-5 pb-14 pt-4 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-[#980000] to-[#720000] px-6 py-12 text-center shadow-xl shadow-red-900/15 sm:px-10 lg:px-16 lg:py-14">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-black/10 blur-3xl" />

        <div className="relative">
          <h2 className="mx-auto max-w-2xl text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {title}
          </h2>

          {text && (
            <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-red-100 sm:text-base">
              {text}
            </p>
          )}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            {primary && (
              <Link
                to={primary.to}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-primary shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-gray-50"
              >
                {primary.label}
                <ArrowRight size={17} />
              </Link>
            )}

            {secondary && (
              <Link
                to={secondary.to}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white transition duration-200 hover:-translate-y-0.5 hover:bg-white/15"
              >
                {secondary.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
