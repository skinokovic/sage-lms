/**
 * AuthHeroPanel
 *
 * Visual side panel used on auth pages (login, create account, etc).
 * Renders a clean, professional e-learning photograph with a subtle
 * dark overlay so the title/subtitle stay readable on any image.
 *
 * Props are unchanged from the previous version — title & subtitle —
 * so no changes are needed anywhere this component is already used.
 */

const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1501504905252-473c47e087f8?auto=format&fit=crop&w=1600&q=80";
// Photo: laptop and open notebook, by Nick Morrison — images.unsplash.com

export default function AuthHeroPanel({ title, subtitle }) {
  return (
    <div className="relative h-56 w-full overflow-hidden md:h-full md:min-h-140">
      {/* Background photo */}
      <img
        // src={HERO_IMAGE_URL}
        src="/assets/sage_auth.png"
        alt=""
        role="presentation"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />

      {/* Dark overlay — a light tint plus a bottom gradient so the copy
          stays legible without muddying the photo itself */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />

      {/* Copy */}
      <div className="relative flex h-full flex-col justify-end p-7 sm:p-10">
        <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 max-w-[34ch] text-sm leading-relaxed text-white/85 sm:text-[15px]">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
