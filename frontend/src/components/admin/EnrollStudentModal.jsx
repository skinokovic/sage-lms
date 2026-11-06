import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  Gift,
  HandCoins,
  Loader2,
  Search,
  UserPlus,
  X,
} from "lucide-react";
import { toast } from "react-toastify";

import { adminEnrollmentApi } from "../../api/adminEnrollmentApi";

/*
  Enroll a registered student in one or more courses without Paystack, after
  receiving a bank transfer or cash payment (or giving a free place).

  Props
    onClose()            close the modal
    onEnrolled(result)   called after at least one enrollment was saved
                         (use it to refresh the page behind the modal)
    initialStudent       optional { id, name, email } to skip the student search
    initialCourseId      optional course id to tick when the modal opens
*/

const PAYMENT_METHODS = [
  {
    value: "bank_transfer",
    label: "Bank transfer",
    description: "Payment confirmed in the school's bank account",
    icon: Banknote,
  },
  {
    value: "cash",
    label: "Cash",
    description: "Paid in person",
    icon: HandCoins,
  },
  {
    value: "complimentary",
    label: "Complimentary",
    description: "Free place, no payment recorded",
    icon: Gift,
  },
];

const money = (value) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#1E3A8A] focus:ring-2 focus:ring-[#1E3A8A]/10";

const OUTCOME_STYLES = {
  enrolled: "bg-green-50 text-green-700",
  reactivated: "bg-green-50 text-green-700",
  already_enrolled: "bg-blue-50 text-blue-700",
  skipped: "bg-amber-50 text-amber-800",
};

const EnrollStudentModal = ({
  onClose,
  onEnrolled,
  initialStudent = null,
  initialCourseId = null,
}) => {
  const [student, setStudent] = useState(initialStudent);
  const [studentSearch, setStudentSearch] = useState("");
  const [studentResults, setStudentResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [coursesError, setCoursesError] = useState("");
  const [courseSearch, setCourseSearch] = useState("");

  // { [courseId]: { amount: "78500" } }
  const [selected, setSelected] = useState({});

  const [method, setMethod] = useState("bank_transfer");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [outcome, setOutcome] = useState(null);

  const searchRequest = useRef(0);

  /* ---------- load the published courses ---------- */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setCoursesLoading(true);
      setCoursesError("");

      try {
        const { data } = await adminEnrollmentApi.courses();
        if (cancelled) return;

        setCourses(data.courses || []);

        if (initialCourseId) {
          const initial = (data.courses || []).find(
            (course) => course.id === initialCourseId,
          );
          if (initial) {
            setSelected({ [initial.id]: { amount: String(initial.price) } });
          }
        }
      } catch (error) {
        if (!cancelled) {
          setCoursesError(
            error.response?.data?.message || "Couldn't load the courses.",
          );
        }
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [initialCourseId]);

  /* ---------- search students as the admin types ---------- */

  useEffect(() => {
    if (student) return undefined;

    const term = studentSearch.trim();

    if (term.length < 2) {
      setStudentResults([]);
      setSearching(false);
      return undefined;
    }

    const timer = setTimeout(async () => {
      const currentRequest = ++searchRequest.current;
      setSearching(true);

      try {
        const { data } = await adminEnrollmentApi.searchStudents(term);
        if (currentRequest === searchRequest.current) {
          setStudentResults(data.students || []);
        }
      } catch {
        if (currentRequest === searchRequest.current) setStudentResults([]);
      } finally {
        if (currentRequest === searchRequest.current) setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [studentSearch, student]);

  /* ---------- derived values ---------- */

  const visibleCourses = useMemo(() => {
    const term = courseSearch.trim().toLowerCase();
    if (!term) return courses;

    return courses.filter(
      (course) =>
        course.title.toLowerCase().includes(term) ||
        course.category.toLowerCase().includes(term),
    );
  }, [courses, courseSearch]);

  const selectedIds = Object.keys(selected);

  const totalAmount =
    method === "complimentary"
      ? 0
      : selectedIds.reduce(
          (sum, id) => sum + (Number(selected[id].amount) || 0),
          0,
        );

  /* ---------- actions ---------- */

  const toggleCourse = (course) => {
    setSelected((current) => {
      if (current[course.id]) {
        const { [course.id]: removed, ...rest } = current;
        return rest;
      }

      return { ...current, [course.id]: { amount: String(course.price) } };
    });
  };

  const setAmount = (courseId, amount) => {
    setSelected((current) => ({ ...current, [courseId]: { amount } }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    if (!student) {
      toast.error("Choose a student to enroll.");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("Choose at least one course.");
      return;
    }

    if (method !== "complimentary") {
      const invalid = selectedIds.find((id) => {
        const value = selected[id].amount;
        return (
          value !== "" && (!Number.isFinite(Number(value)) || Number(value) < 0)
        );
      });

      if (invalid) {
        toast.error("Enter a valid amount for each selected course.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const { data } = await adminEnrollmentApi.enroll({
        studentId: student.id,
        paymentMethod: method,
        paymentReference: reference.trim(),
        note: note.trim(),
        items: selectedIds.map((id) => ({
          courseId: id,
          ...(method !== "complimentary" && selected[id].amount !== ""
            ? { amountPaid: Number(selected[id].amount) }
            : {}),
        })),
      });

      setOutcome(data);

      if (data.enrolledCount > 0) {
        toast.success(
          `${data.student.name} was enrolled in ${data.enrolledCount} ${
            data.enrolledCount === 1 ? "course" : "courses"
          }.`,
        );
        onEnrolled?.(data);
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Couldn't enroll the student. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------- result screen ---------- */

  if (outcome) {
    return (
      <Overlay onClose={onClose}>
        <Header title="Enrollment result" onClose={onClose} />

        <div className="space-y-3 p-5 sm:p-6">
          <p className="text-sm text-gray-600">
            Results for{" "}
            <span className="font-semibold text-gray-900">
              {outcome.student.name}
            </span>{" "}
            ({outcome.student.email})
          </p>

          {outcome.results.map((result) => (
            <div
              key={result.courseId}
              className={`flex items-start gap-3 rounded-xl p-4 ${
                OUTCOME_STYLES[result.outcome] || OUTCOME_STYLES.skipped
              }`}
            >
              {result.outcome === "enrolled" ||
              result.outcome === "reactivated" ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
              ) : (
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
              )}

              <div className="min-w-0">
                <p className="text-sm font-semibold">{result.title}</p>
                <p className="mt-0.5 text-xs">{result.message}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-gray-100 p-5 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#1E3A8A] px-6 py-3 text-sm font-semibold text-white hover:bg-[#172f70]"
          >
            Done
          </button>
        </div>
      </Overlay>
    );
  }

  /* ---------- form ---------- */

  return (
    <Overlay onClose={onClose}>
      <Header title="Enroll a student" onClose={onClose} />

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
          {/* Student */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              1. Student
            </h3>

            {student ? (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {student.name}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {student.email}
                  </p>
                </div>

                {!initialStudent && (
                  <button
                    type="button"
                    onClick={() => setStudent(null)}
                    className="shrink-0 text-xs font-semibold text-[#B00000] hover:underline"
                  >
                    Change
                  </button>
                )}
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                    placeholder="Search registered students by name or email"
                    className={`${INPUT_CLASS} pl-10`}
                    autoFocus
                  />
                  {searching && (
                    <Loader2
                      size={16}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-gray-400"
                    />
                  )}
                </div>

                {studentResults.length > 0 && (
                  <ul className="mt-2 max-h-52 divide-y divide-gray-100 overflow-y-auto rounded-xl border border-gray-200">
                    {studentResults.map((result) => (
                      <li key={result.id}>
                        <button
                          type="button"
                          disabled={!result.isActive}
                          onClick={() => {
                            setStudent(result);
                            setStudentResults([]);
                            setStudentSearch("");
                          }}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold text-gray-900">
                              {result.name}
                            </span>
                            <span className="block truncate text-xs text-gray-500">
                              {result.email}
                            </span>
                          </span>

                          {!result.isActive && (
                            <span className="shrink-0 text-[11px] font-semibold text-gray-400">
                              Deactivated
                            </span>
                          )}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {studentSearch.trim().length >= 2 &&
                  !searching &&
                  studentResults.length === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      No registered student matches that search. The student
                      needs an account before they can be enrolled.
                    </p>
                  )}
              </div>
            )}
          </section>

          {/* Courses */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              2. Courses
            </h3>

            <div className="relative">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                placeholder="Filter published courses"
                className={`${INPUT_CLASS} pl-10`}
              />
            </div>

            <div className="mt-2 max-h-64 overflow-y-auto rounded-xl border border-gray-200">
              {coursesLoading && (
                <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
                  <Loader2 size={17} className="animate-spin" />
                  Loading courses…
                </div>
              )}

              {coursesError && (
                <p className="p-6 text-center text-sm text-red-600">
                  {coursesError}
                </p>
              )}

              {!coursesLoading &&
                !coursesError &&
                visibleCourses.length === 0 && (
                  <p className="p-6 text-center text-sm text-gray-500">
                    {courses.length === 0
                      ? "There are no published courses yet."
                      : "No courses match your filter."}
                  </p>
                )}

              {visibleCourses.map((course) => {
                const isSelected = Boolean(selected[course.id]);

                return (
                  <div
                    key={course.id}
                    className={`border-b border-gray-100 p-4 last:border-b-0 ${
                      isSelected ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <label className="flex cursor-pointer items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCourse(course)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A]"
                      />

                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold text-gray-900">
                          {course.title}
                        </span>
                        <span className="block text-xs text-gray-500">
                          {course.category && `${course.category} · `}
                          {course.price > 0 ? money(course.price) : "Free"}
                        </span>
                      </span>
                    </label>

                    {isSelected && method !== "complimentary" && (
                      <div className="ml-7 mt-3 flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Amount received (₦)
                        </span>
                        <input
                          type="number"
                          min="0"
                          value={selected[course.id].amount}
                          onChange={(event) =>
                            setAmount(course.id, event.target.value)
                          }
                          className="w-36 rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1E3A8A]"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Payment */}
          <section>
            <h3 className="mb-2 text-sm font-semibold text-gray-700">
              3. How did the student pay?
            </h3>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {PAYMENT_METHODS.map((option) => {
                const Icon = option.icon;
                const active = method === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setMethod(option.value)}
                    className={`rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-[#1E3A8A] bg-blue-50 ring-1 ring-[#1E3A8A]"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon
                        size={17}
                        className={active ? "text-[#1E3A8A]" : "text-gray-500"}
                      />
                      <span
                        className={`text-sm font-semibold ${
                          active ? "text-[#1E3A8A]" : "text-gray-700"
                        }`}
                      >
                        {option.label}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {option.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {method !== "complimentary" && (
              <div className="mt-4">
                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Payment reference{" "}
                  <span className="font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reference}
                  maxLength={100}
                  onChange={(event) => setReference(event.target.value)}
                  placeholder="e.g. bank transfer reference or teller number"
                  className={INPUT_CLASS}
                />
              </div>
            )}

            <div className="mt-4">
              <label className="mb-2 block text-sm font-semibold text-gray-700">
                Note{" "}
                <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Anything worth remembering about this enrollment"
                className={`${INPUT_CLASS} resize-none`}
              />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-gray-600">
            {selectedIds.length}{" "}
            {selectedIds.length === 1 ? "course" : "courses"} selected
            {method !== "complimentary" && selectedIds.length > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-gray-900">
                  {money(totalAmount)}
                </span>{" "}
                received
              </>
            )}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white hover:bg-[#8f0000] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <UserPlus size={17} />
              )}
              {submitting ? "Enrolling…" : "Enroll student"}
            </button>
          </div>
        </div>
      </form>
    </Overlay>
  );
};

/* ============================================================
   LAYOUT HELPERS
============================================================ */

const Overlay = ({ children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="absolute inset-0 cursor-default bg-black/50"
    />

    <div className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:max-h-[90vh] sm:rounded-2xl">
      {children}
    </div>
  </div>
);

const Header = ({ title, onClose }) => (
  <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-6">
    <h2 className="text-base font-bold text-gray-900">{title}</h2>

    <button
      type="button"
      onClick={onClose}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
    >
      <X size={19} />
    </button>
  </div>
);

export default EnrollStudentModal;
