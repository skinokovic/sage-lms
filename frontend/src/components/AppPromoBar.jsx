import { Smartphone } from "lucide-react";

/**
 * Slim announcement bar for the Sage mobile app — sits above the main
 * Navbar and scrolls away with the page (Navbar itself stays sticky).
 */
export default function AppPromoBar() {
  return (
    <div className="bg-primary">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-3 gap-y-1.5 px-4 py-2.5 sm:flex-nowrap sm:justify-between sm:px-6">
        <div className="flex flex-1 items-center justify-center gap-2 text-center">
          <p className="text-xs font-bold text-white sm:text-sm">
            Join others using Sage App for more effective use !
          </p>
          <Smartphone
            size={16}
            className="hidden shrink-0 text-blue-900 sm:block"
          />
        </div>

        <a
          href="https://play.google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 rounded-md bg-white px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-muted sm:text-sm"
        >
          Get App
        </a>
      </div>
    </div>
  );
}
