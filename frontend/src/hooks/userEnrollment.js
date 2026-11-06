import { useCallback, useEffect, useReducer, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import { enrollmentApi } from "../api/enrollmentApi";

// Fire this event after anything that changes a student's enrollments, so every
// component using the hook reloads.
export const ENROLLMENTS_UPDATED_EVENT = "sage-enrollments-updated";

// Where a student opens a course they own.
export const courseLearnPath = (courseId) =>
  `/dashboard/student/courses/${courseId}/learn`;

const idOf = (value) => String(value?.id || value?._id || value || "");

const NO_COURSES = new Set();

/*
  One shared copy of the student's enrolled course ids. Many components (every
  course card on a page) use the hook at once, so the list is loaded a single
  time and shared instead of once per card.
*/
const store = {
  userId: "",
  ids: NO_COURSES,
  loaded: false,
  request: null,
  listeners: new Set(),
};

const notify = () => store.listeners.forEach((listener) => listener());

const resetStore = (userId) => {
  store.userId = userId;
  store.ids = NO_COURSES;
  store.loaded = false;
  store.request = null;
  notify();
};

const loadEnrollments = (userId, { force = false } = {}) => {
  if (store.userId !== userId) resetStore(userId);

  // A load is already running: everyone waits for the same one.
  if (store.request) return store.request;

  if (store.loaded && !force) return Promise.resolve();

  const request = enrollmentApi
    .mine()
    .then(({ data }) => {
      if (store.userId !== userId) return;

      store.ids = new Set(
        (data.enrollments || [])
          .map((enrollment) => idOf(enrollment.course || enrollment.courseId))
          .filter(Boolean),
      );
    })
    .catch(() => {
      // Keep whatever we already knew; prices simply show as normal.
    })
    .finally(() => {
      if (store.userId === userId) store.loaded = true;
      if (store.request === request) store.request = null;
      notify();
    });

  store.request = request;
  return request;
};

/*
  Which courses the logged-in student already owns, plus one-click enrollment
  for free courses.

    isEnrolled(courseId)   true when the student owns the course
    ready                  false until the list has loaded (show the price meanwhile)
    enrollFree(course)     enroll in a free course, then open it
    enrollingId            id of the course being enrolled in right now
*/
export default function useEnrolledCourses() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, status: authStatus } = useSelector((state) => state.auth);

  const isStudent = user?.role === "student";
  const userId = String(user?.id || user?._id || "");

  const [, rerender] = useReducer((count) => count + 1, 0);
  const [enrollingId, setEnrollingId] = useState(null);

  // Re-render whenever the shared list changes
  useEffect(() => {
    store.listeners.add(rerender);
    return () => store.listeners.delete(rerender);
  }, []);

  useEffect(() => {
    // The logged-in user is still being restored after a page refresh.
    if (authStatus === "checking" || !isStudent) return undefined;

    loadEnrollments(userId);

    const refresh = () => loadEnrollments(userId, { force: true });
    window.addEventListener(ENROLLMENTS_UPDATED_EVENT, refresh);

    return () => window.removeEventListener(ENROLLMENTS_UPDATED_EVENT, refresh);
  }, [authStatus, isStudent, userId]);

  const ownsStore = isStudent && store.userId === userId;
  const enrolledIds = ownsStore ? store.ids : NO_COURSES;
  const ready =
    authStatus !== "checking" && (!isStudent || (ownsStore && store.loaded));

  const isEnrolled = useCallback(
    (courseId) => enrolledIds.has(String(courseId)),
    [enrolledIds],
  );

  const enrollFree = useCallback(
    async (course) => {
      const courseId = String(course.id);

      if (!user) {
        toast.info("Log in as a student to enroll in this course.");
        navigate("/login", { state: { from: location.pathname } });
        return;
      }

      if (!isStudent) {
        toast.info("Only student accounts can enroll in courses.");
        return;
      }

      if (enrollingId) return;

      setEnrollingId(courseId);

      try {
        await enrollmentApi.enroll(courseId);

        toast.success(`You're enrolled in ${course.title}!`);
        window.dispatchEvent(new Event(ENROLLMENTS_UPDATED_EVENT));
        navigate(courseLearnPath(courseId));
      } catch (error) {
        if (error?.response?.status === 409) {
          // Already enrolled: just take them to the course.
          toast.info("You're already enrolled in this course.");
          window.dispatchEvent(new Event(ENROLLMENTS_UPDATED_EVENT));
          navigate(courseLearnPath(courseId));
        } else {
          toast.error(
            error?.response?.data?.message ||
              "Couldn't enroll you in this course. Please try again.",
          );
        }
      } finally {
        setEnrollingId(null);
      }
    },
    [user, isStudent, enrollingId, navigate, location.pathname],
  );

  return {
    isStudent,
    ready,
    enrolledIds,
    isEnrolled,
    enrollFree,
    enrollingId,
  };
}
