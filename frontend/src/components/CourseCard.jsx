import { useEffect, useState } from "react";
import { BookOpen, CheckCircle2, Heart, Loader2, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

import useEnrolledCourses, { courseLearnPath } from "../hooks/userEnrollment";

const WISHLIST_KEY = "sage_wishlist";
const CART_KEY = "sage_cart";

const BADGE_STYLES = {
  hot: "bg-primary text-white",
  premium: "bg-heading text-white",
};

const readList = (key) => {
  try {
    const stored = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch {
    return [];
  }
};

const isInList = (key, id) =>
  readList(key).some((item) => String(item.id) === String(id));

/**
 * Course preview card — thumbnail, optional corner badge, wishlist
 * toggle, rating/reviews, price (with optional struck-through original
 * price) and one action button. Rendered inside CourseSlider for the
 * Popular / Featured / Trending rows on the homepage.
 *
 * Every card has the SAME width and height regardless of its content:
 *   - the title always reserves two lines (clamped if longer)
 *   - the instructor name and the chips row are always a single line
 *     (clipped if too long)
 *   - the footer is a fixed-height row that never wraps
 *
 * The price area and button follow what the student has:
 *   - owns the course   -> "Enrolled" + "Continue learning"
 *   - free course       -> "Free" + "Enroll for free" (one click)
 *   - paid course       -> the price + "Add to cart" (then "View cart")
 *
 * `badge`: { label: string, tone: "hot" | "premium" } — optional corner ribbon
 * `bestseller`: boolean — shows a green "Bestseller" pill in the meta row
 */
export default function CourseCard({
  id,
  title,
  instructor,
  image,
  category,
  badge,
  bestseller = false,
  rating,
  reviews,
  price,
  originalPrice,
}) {
  const { isEnrolled, enrollFree, enrollingId } = useEnrolledCourses();

  const [saved, setSaved] = useState(() => isInList(WISHLIST_KEY, id));
  const [inCart, setInCart] = useState(() => isInList(CART_KEY, id));

  // Stay in step with the wishlist and cart (other cards, other pages, other tabs)
  useEffect(() => {
    const sync = () => {
      setSaved(isInList(WISHLIST_KEY, id));
      setInCart(isInList(CART_KEY, id));
    };

    window.addEventListener("sage-wishlist-updated", sync);
    window.addEventListener("sage-cart-updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("sage-wishlist-updated", sync);
      window.removeEventListener("sage-cart-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, [id]);

  const enrolled = isEnrolled(id);
  const isFree = Number(price || 0) === 0;
  const enrolling = enrollingId === String(id);
  const reviewCount = Number(reviews) || 0;

  const toggleWishlist = () => {
    const list = readList(WISHLIST_KEY);

    if (saved) {
      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify(list.filter((item) => String(item.id) !== String(id))),
      );
      toast.info("Removed from your wishlist.");
    } else {
      localStorage.setItem(
        WISHLIST_KEY,
        JSON.stringify([...list, { id, title, image, price }]),
      );
      toast.success("Saved to your wishlist.");
    }

    window.dispatchEvent(new Event("sage-wishlist-updated"));
  };

  const addToCart = () => {
    const cart = readList(CART_KEY);

    if (!cart.some((item) => String(item.id) === String(id))) {
      localStorage.setItem(
        CART_KEY,
        JSON.stringify([
          ...cart,
          {
            id,
            title,
            category: category || "Course",
            instructor: instructor || "SAGE Instructor",
            image: image || "",
            price: Number(price || 0),
            originalPrice: Number(originalPrice || price || 0),
            duration: "Self-paced",
            access: "Lifetime access",
          },
        ]),
      );
      window.dispatchEvent(new Event("sage-cart-updated"));
    }

    toast.success("Course added to cart.");
  };

  // Same height, never wraps, never shrinks
  const actionBase =
    "inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-control px-3 text-xs font-semibold transition-colors";

  return (
    <div className="flex w-[min(78vw,272px)] shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface transition-shadow hover:shadow-md sm:w-72">
      {/* Thumbnail (fixed 16:9, so every card's image is the same height) */}
      <div className="relative aspect-video w-full overflow-hidden bg-surface-muted">
        <Link to={`/courses/${id}`} className="absolute inset-0 block">
          {image ? (
            <img
              src={image}
              alt={title}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-body/40">
              <BookOpen size={32} />
            </div>
          )}
        </Link>

        {badge && (
          <span
            className={`pointer-events-none absolute left-2 top-2 z-10 rounded px-2 py-1 text-[11px] font-semibold ${
              BADGE_STYLES[badge.tone] ?? BADGE_STYLES.hot
            }`}
          >
            {badge.label}
          </span>
        )}

        <button
          type="button"
          aria-label={saved ? "Remove from wishlist" : "Save to wishlist"}
          aria-pressed={saved}
          onClick={toggleWishlist}
          className="absolute right-2 top-2 z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-heading shadow-sm transition-colors hover:text-primary"
        >
          <Heart
            size={16}
            className={saved ? "fill-primary text-primary" : ""}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {/* Title: always two lines tall (h-11), clamped if longer */}
        <Link to={`/courses/${id}`} className="block">
          <h3 className="line-clamp-2 h-11 overflow-hidden font-semibold leading-snug text-heading">
            {title}
          </h3>
        </Link>

        {/* Instructor: always one line */}
        <p className="h-5 truncate text-sm leading-5 text-body">{instructor}</p>

        {/* Chips: always one line; the category shrinks first */}
        <div className="flex h-6 items-center gap-1.5 overflow-hidden">
          <span className="min-w-0 truncate rounded border border-line px-2 py-0.5 text-[11px] text-body">
            {category || "Course"}
          </span>
          {bestseller && (
            <span className="shrink-0 whitespace-nowrap rounded bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              Bestseller
            </span>
          )}
          {Number(rating) > 0 && (
            <span className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded border border-line px-2 py-0.5 text-[11px] font-semibold text-heading">
              <Star size={12} className="fill-amber-400 text-amber-400" />
              {Number(rating).toFixed(1)}
            </span>
          )}
          {reviewCount > 0 && (
            <span className="shrink-0 whitespace-nowrap rounded border border-line px-2 py-0.5 text-[11px] text-body">
              {reviewCount.toLocaleString()}{" "}
              {reviewCount === 1 ? "rating" : "ratings"}
            </span>
          )}
        </div>

        {/* Footer: fixed-height row, price/status on the left, button on the right */}
        <div className="mt-auto flex h-10 items-center justify-between gap-2 pt-2">
          {/* Price area */}
          {enrolled ? (
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-700">
              <CheckCircle2 size={12} className="shrink-0" />
              <span className="truncate">Enrolled</span>
            </span>
          ) : isFree ? (
            <span className="font-bold text-emerald-600">Free</span>
          ) : (
            <div className="flex min-w-0 items-baseline gap-2 overflow-hidden">
              <span className="shrink-0 whitespace-nowrap font-bold text-heading">
                ₦{Number(price).toLocaleString()}
              </span>
              {originalPrice > price && (
                <span className="truncate text-xs text-body line-through">
                  ₦{Number(originalPrice).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Action */}
          {enrolled ? (
            <Link
              to={courseLearnPath(id)}
              className={`${actionBase} bg-primary text-white hover:bg-primary-hover`}
            >
              Continue learning
            </Link>
          ) : isFree ? (
            <button
              type="button"
              onClick={() => enrollFree({ id, title })}
              disabled={enrolling}
              className={`${actionBase} bg-primary text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70`}
            >
              {enrolling && <Loader2 size={12} className="animate-spin" />}
              {enrolling ? "Enrolling…" : "Enroll for free"}
            </button>
          ) : inCart ? (
            <Link
              to="/cart"
              className={`${actionBase} border border-primary text-primary hover:bg-primary hover:text-white`}
            >
              View cart
            </Link>
          ) : (
            <button
              type="button"
              onClick={addToCart}
              className={`${actionBase} border border-primary text-primary hover:bg-primary hover:text-white`}
            >
              Add to cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
