import { useState } from "react";
import { ArrowLeft, ClipboardList, FileText, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import AssignmentForm from "../../components/instructor/AssignmentForm";
import { instructorAssignmentApi } from "../../api/instructorAssignmentApi";

const CreateAssignment = () => {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);

  const handleCreateAssignment = async (payload) => {
    setSubmitting(true);

    try {
      await instructorAssignmentApi.create(payload);

      toast.success(
        payload.status === "Published"
          ? "Assignment published successfully."
          : "Assignment saved as draft.",
      );

      navigate("/dashboard/instructor/assignments");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to create assignment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/instructor/assignments")}
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
                Create Assignment
              </h1>
            </div>

            <p className="mt-1 text-sm text-gray-500">
              Create an assignment for your students.
            </p>
          </div>
        </div>
      </div>

      {/* =====================================================
          QUICK INFO
      ===================================================== */}

      <div className="grid gap-3 sm:grid-cols-3">
        <InfoCard
          icon={FileText}
          title="Create Task"
          description="Define what students need to complete."
        />

        <InfoCard
          icon={Users}
          title="Set Requirements"
          description="Configure submissions and grading."
        />

        <InfoCard
          icon={ClipboardList}
          title="Publish"
          description="Make the assignment available to students."
        />
      </div>

      {/* =====================================================
          FORM
      ===================================================== */}

      <AssignmentForm
        onSubmit={handleCreateAssignment}
        onCancel={() => navigate("/dashboard/instructor/assignments")}
        submitting={submitting}
        submitLabel="Create Assignment"
      />
    </div>
  );
};

/* ==============================================================
   INFO CARD
============================================================== */

const InfoCard = ({ icon: Icon, title, description }) => {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
          <Icon className="h-5 w-5" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>

          <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

export default CreateAssignment;
