import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import { StarInput } from "./StarRating";
import { reviewApi } from "../../api/reviewApi";
import { errorMessage } from "../../utils/reviewUtils";

const textareaClass =
  "mt-3 w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20";

/**
 * Create or edit a review for one course (course rating + instructor rating).
 * initial: an existing review, or null.  onSaved(review) runs after saving.
 */
export default function ReviewForm({
  courseId,
  instructorName = "the instructor",
  initial = null,
  onSaved,
  onCancel,
}) {
  const [courseRating, setCourseRating] = useState(initial?.courseRating || 0);
  const [courseComment, setCourseComment] = useState(
    initial?.courseComment || "",
  );
  const [instructorRating, setInstructorRating] = useState(
    initial?.instructorRating || 0,
  );
  const [instructorComment, setInstructorComment] = useState(
    initial?.instructorComment || "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (!courseRating || !instructorRating) {
      setError("Please give both a course rating and an instructor rating.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const { data } = await reviewApi.save(courseId, {
        courseRating,
        courseComment,
        instructorRating,
        instructorComment,
      });
      toast.success(initial ? "Review updated" : "Thanks for your review!");
      onSaved?.(data.review);
    } catch (err) {
      setError(
        errorMessage(err, "Couldn’t save your review. Please try again."),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <fieldset className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <legend className="px-1 text-sm font-bold text-gray-900">
          Rate this course
        </legend>
        <StarInput
          label="Course rating"
          value={courseRating}
          onChange={setCourseRating}
          disabled={saving}
        />
        <textarea
          aria-label="Course review comment"
          rows={3}
          maxLength={1000}
          value={courseComment}
          onChange={(e) => setCourseComment(e.target.value)}
          placeholder="What did you think of the content? (optional)"
          className={textareaClass}
        />
      </fieldset>

      <fieldset className="rounded-2xl border border-gray-100 bg-gray-50 p-5">
        <legend className="px-1 text-sm font-bold text-gray-900">
          Rate {instructorName}
        </legend>
        <StarInput
          label="Instructor rating"
          value={instructorRating}
          onChange={setInstructorRating}
          disabled={saving}
        />
        <textarea
          aria-label="Instructor review comment"
          rows={3}
          maxLength={1000}
          value={instructorComment}
          onChange={(e) => setInstructorComment(e.target.value)}
          placeholder="How was the teaching and support? (optional)"
          className={textareaClass}
        />
      </fieldset>

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {saving ? "Saving…" : initial ? "Update review" : "Submit review"}
        </button>

        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="cursor-pointer rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
