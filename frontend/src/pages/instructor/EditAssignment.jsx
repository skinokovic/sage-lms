import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, ClipboardList, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import AssignmentForm from "../../components/instructor/AssignmentForm";
import { instructorAssignmentApi } from "../../api/instructorAssignmentApi";
import { toLagosParts } from "../../utils/scheduleFormat";

const EditAssignment = () => {
  const navigate = useNavigate();
  const { assignmentId } = useParams();

  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const goBack = () => navigate("/dashboard/instructor/assignments");

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    try {
      const { data } = await instructorAssignmentApi.get(assignmentId);
      setAssignment(data.assignment);
    } catch (error) {
      setLoadError(
        error.response?.data?.message || "Couldn't load this assignment.",
      );
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    load();
  }, [load]);

  // Memoized so the form isn't reset by unrelated re-renders
  const initialData = useMemo(() => {
    if (!assignment) return null;

    const due = assignment.dueDate ? toLagosParts(assignment.dueDate) : null;

    return {
      title: assignment.title,
      course: assignment.courseId,
      type: assignment.type,
      description: assignment.description,
      instructions: assignment.instructions,
      points: String(assignment.points),
      dueDate: due?.date || "",
      dueTime: due?.time || "",
      status: assignment.status,
      submissionType: assignment.submissionType,
      attachmentRequired: assignment.attachmentRequired,
      allowLateSubmission: assignment.allowLateSubmission,
      resources: assignment.resources.map((resource) => ({
        id: resource.id,
        name: resource.name,
        url: resource.url,
      })),
    };
  }, [assignment]);

  const handleUpdate = async (payload) => {
    setSubmitting(true);

    try {
      await instructorAssignmentApi.update(assignmentId, payload);

      toast.success("Assignment updated successfully.");
      goBack();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex items-start gap-3">
        <button
          type="button"
          onClick={goBack}
          className="mt-1 cursor-pointer rounded-lg border border-gray-200 bg-white p-2 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-red-50 p-2 text-primary">
              <ClipboardList className="h-5 w-5" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Edit Assignment
            </h1>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Update the details, deadline or status of this assignment.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white py-20 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading assignment…
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <AlertCircle size={26} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Couldn't load this assignment
          </h3>

          <p className="mt-2 text-sm text-gray-500">{loadError}</p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={load}
              className="cursor-pointer rounded-lg bg-[#B00000] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={goBack}
              className="cursor-pointer rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to Assignments
            </button>
          </div>
        </div>
      ) : (
        <AssignmentForm
          initialData={initialData}
          onSubmit={handleUpdate}
          onCancel={goBack}
          submitting={submitting}
          submitLabel="Save Changes"
        />
      )}
    </div>
  );
};

export default EditAssignment;
