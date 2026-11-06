/**
 * Small icon + text card used in the homepage "why SAGE" row.
 * `bgClassName` sets the icon's tinted background chip; pass the icon
 * itself as a lucide-react element (colored via className) so this
 * component stays icon-library agnostic.
 */
export default function FeatureCard({ icon, bgClassName, title, description }) {
  return (
    <div className="flex flex-1 items-start gap-4 px-4 py-2 sm:px-6">
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${bgClassName}`}
      >
        {icon}
      </div>
      <div>
        <h3 className="mb-1 font-semibold text-heading">{title}</h3>
        <p className="text-sm text-body">{description}</p>
      </div>
    </div>
  );
}
