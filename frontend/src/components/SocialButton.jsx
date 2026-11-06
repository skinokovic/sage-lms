import { FcGoogle } from "react-icons/fc";
import { FaFacebookF } from "react-icons/fa";

/**
 * Lucide doesn't ship brand marks (Google's "G", Facebook's "f"), so
 * these come from react-icons instead. `FcGoogle` (the Flat Color set)
 * already carries Google's official four-color mark, so it needs no
 * styling. `FaFacebookF` is monochrome by default, so it's tinted to
 * Facebook's brand blue via className. Everything else in the app
 * icon-wise should still come from lucide-react.
 */
const icons = {
  google: <FcGoogle size={18} />,
  facebook: <FaFacebookF size={18} className="text-[#1877F2]" />,
};

export default function SocialButton({ provider, children, ...props }) {
  return (
    <button
      type="button"
      className="flex-1 h-11 cursor-pointer rounded-control border border-line bg-surface flex items-center justify-center gap-2 text-sm font-medium text-heading hover:bg-surface-muted transition-colors"
      {...props}
    >
      {icons[provider]}
      <span>{children}</span>
    </button>
  );
}
