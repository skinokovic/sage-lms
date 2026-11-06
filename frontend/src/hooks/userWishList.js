import { useEffect, useState } from "react";

const WISHLIST_KEY = "sage_wishlist";

const readCount = () => {
  try {
    const stored = JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
    return Array.isArray(stored) ? stored.length : 0;
  } catch {
    return 0;
  }
};

// How many courses are saved in the wishlist, kept up to date live.
export default function useWishlistCount() {
  const [count, setCount] = useState(readCount);

  useEffect(() => {
    const sync = () => setCount(readCount());

    window.addEventListener("sage-wishlist-updated", sync);
    window.addEventListener("storage", sync);

    return () => {
      window.removeEventListener("sage-wishlist-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return count;
}
