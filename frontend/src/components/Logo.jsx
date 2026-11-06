import logoDefault from "../../assets/Group 15.png";
// import logoLight from "../../assets/sage-crest-light.png";

/**
 * SAGE brand mark — crest image + stacked wordmark, matching the school's identity.
 *
 * Usage:
 *   <Logo />                     → icon + wordmark, default size
 *   <Logo iconOnly />            → just the crest (e.g. favicon, collapsed nav)
 *   <Logo size={56} />           → scale the crest up/down
 *   <Logo variant="light" />     → light crest for use on dark/red backgrounds
 */
export default function Logo({
  iconOnly = false,
  size = 44,
  variant = "default",
}) {
  const isLight = variant === "light";
  const crestSrc = isLight
    ? logoDefault /* swap for logoLight once added */
    : logoDefault;

  return (
    <div className="inline-flex items-center gap-2">
      <img
        src={crestSrc}
        alt="SAGE crest"
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          flexShrink: 0,
        }}
      />
      {!iconOnly && (
        <div className="flex flex-col justify-center leading-tight">
          <span
            className={`font-sans font-extrabold tracking-tight ${
              isLight ? "text-white" : "text-heading"
            }`}
            style={{ fontSize: size * 0.42, lineHeight: 1.1 }}
          >
            SAGE
          </span>
          <span
            className={`font-sans font-medium ${
              isLight ? "text-white/90" : "text-gray-600"
            }`}
            style={{
              fontSize: size * 0.3,
              lineHeight: 1.25,
              maxWidth: size * 3.6,
            }}
          >
            School Of Business &amp; Management
          </span>
        </div>
      )}
    </div>
  );
}
