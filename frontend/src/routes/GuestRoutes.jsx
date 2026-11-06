import { useRef } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";

/**
 * Wraps pages that only make sense for visitors who are NOT logged in
 * (login, create account, forgot password). A logged-in user who opens
 * one of them, by link, typed URL, refresh or the back button, is sent
 * to the home page.
 *
 * Usage in App.jsx:
 *   <Route element={<GuestRoute />}>
 *     <Route path="/login" element={<Login />} />
 *     ...
 *   </Route>
 */
export default function GuestRoute() {
  const { user } = useSelector((state) => state.auth);

  // Was a saved session present when this page opened? Remembering this
  // matters: when a guest logs in on this very page, `user` becomes set
  // while they are still here, and the Login page then sends them to their
  // dashboard itself. We must not hijack that with a redirect to "/".
  const openedWithSession = useRef(Boolean(localStorage.getItem("sage_token")));

  if (openedWithSession.current && user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
