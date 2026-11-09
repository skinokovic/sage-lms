import { useCallback, useEffect, useRef, useState } from "react";
import { couponApi } from "../api/couponApi";

const COUPON_KEY = "sage_coupon";

const readStored = () => {
  try {
    return localStorage.getItem(COUPON_KEY) || "";
  } catch {
    return "";
  }
};

const writeStored = (code) => {
  try {
    if (code) localStorage.setItem(COUPON_KEY, code);
    else localStorage.removeItem(COUPON_KEY);
  } catch {
    /* storage can be unavailable: ignore */
  }
};

const cleanCode = (value) =>
  String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 30);

const cartCourseIds = (items) =>
  items
    .filter((item) => !item.unavailable)
    .map((item) => String(item.courseId || item.id || item._id || ""))
    .filter(Boolean);

/**
 * The applied coupon for the current cart, shared by the Cart and Checkout
 * pages through localStorage ("sage_coupon").
 *
 * The SERVER decides every price. This hook only asks it, and re-checks the
 * coupon whenever the cart changes (a coupon can stop applying if a course is
 * removed, or expire in the meantime).
 *
 *   const coupon = useCoupon(items);
 *   coupon.quote            the server's answer (null when no coupon applies)
 *   coupon.itemQuote(id)    one course's { price, discount, finalPrice }
 *   coupon.apply(code)      -> Promise<boolean>
 *   coupon.remove()
 *   coupon.stash(code)      remember a code for later (e.g. empty cart + link)
 */
export default function useCoupon(items) {
  const [code, setCode] = useState(readStored);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestRef = useRef(0);
  const checkedRef = useRef(""); // "CODE|id1,id2" last confirmed by the server

  const idsKey = cartCourseIds(items).join(",");

  // Check the stored coupon on load and whenever the cart changes
  useEffect(() => {
    if (!code) {
      setQuote(null);
      return;
    }

    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) {
      setQuote(null);
      return;
    }

    const key = `${code}|${idsKey}`;
    if (checkedRef.current === key) return; // apply() just confirmed this one

    const requestId = ++requestRef.current;
    setLoading(true);

    couponApi
      .validate(
        code,
        ids.map((courseId) => ({ courseId })),
      )
      .then(({ data }) => {
        if (requestId !== requestRef.current) return;
        checkedRef.current = key;
        setQuote(data);
        setError("");
      })
      .catch((err) => {
        if (requestId !== requestRef.current) return;

        if (err.response) {
          // The server refused it: drop the coupon and say why
          setError(
            `${code} was removed. ${
              err.response.data?.message || "It can’t be used on this order."
            }`,
          );
          setQuote(null);
          setCode("");
          writeStored("");
          checkedRef.current = "";
        } else {
          setError(
            "We couldn’t verify your coupon. Check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (requestId === requestRef.current) setLoading(false);
      });
  }, [code, idsKey]);

  const apply = useCallback(
    async (raw) => {
      const candidate = cleanCode(raw);
      if (!candidate) {
        setError("Enter a coupon code.");
        return false;
      }

      const ids = idsKey ? idsKey.split(",") : [];
      if (ids.length === 0) {
        setError("Add a course to your cart first.");
        return false;
      }

      const requestId = ++requestRef.current;
      setLoading(true);
      setError("");

      try {
        const { data } = await couponApi.validate(
          candidate,
          ids.map((courseId) => ({ courseId })),
        );
        if (requestId !== requestRef.current) return false;

        checkedRef.current = `${candidate}|${idsKey}`;
        setQuote(data);
        setCode(candidate);
        writeStored(candidate);
        return true;
      } catch (err) {
        if (requestId === requestRef.current) {
          setError(
            err.response?.data?.message ||
              "We couldn’t check that code. Please try again.",
          );
        }
        return false;
      } finally {
        if (requestId === requestRef.current) setLoading(false);
      }
    },
    [idsKey],
  );

  const remove = useCallback(() => {
    requestRef.current += 1;
    checkedRef.current = "";
    setCode("");
    setQuote(null);
    setError("");
    setLoading(false);
    writeStored("");
  }, []);

  // Keep a code until there is something in the cart to apply it to
  const stash = useCallback((raw) => {
    const candidate = cleanCode(raw);
    if (!candidate) return;
    checkedRef.current = "";
    setCode(candidate);
    writeStored(candidate);
  }, []);

  const itemQuote = useCallback(
    (courseId) =>
      quote?.items?.find((line) => line.courseId === String(courseId)) || null,
    [quote],
  );

  return {
    code,
    quote,
    error,
    loading,
    applied: Boolean(quote),
    apply,
    remove,
    stash,
    itemQuote,
  };
}
