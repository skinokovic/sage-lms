import { useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  Info,
  MapPin,
  Video,
} from "lucide-react";

import { toast } from "react-toastify";

import ScheduleForm from "../../components/instructor/ScheduleForm";
import { scheduleApi } from "../../api/scheduleApi";

const CreateSchedule = () => {
  const navigate = useNavigate();

  const handleCreateSchedule = async (payload) => {
    try {
      await scheduleApi.create(payload);

      toast.success("Schedule created successfully.");
      navigate("/dashboard/instructor/schedule");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to create schedule. Please try again.",
      );
    }
  };

  const handleCancel = () => {
    navigate("/dashboard/instructor/schedule");
  };

  return (
    <div className="mx-auto max-w-7xl">
      {/* =====================================================
          PAGE HEADER
      ====================================================== */}

      <div className="mb-6">
        <button
          type="button"
          onClick={handleCancel}
          className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#B00000]"
        >
          <ArrowLeft size={17} />
          Back to Schedules
        </button>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-3">
            <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B00000]/10 text-[#B00000] sm:flex">
              <CalendarCheck2 size={24} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Create Schedule
              </h1>

              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Create a new teaching session for your students. Set the date,
                time, course, delivery mode and attendance details.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          WORKFLOW
      ====================================================== */}

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <WorkflowStep
          icon={CalendarCheck2}
          title="1. Schedule"
          description="Set the session details"
          active
        />

        <WorkflowStep
          icon={Clock3}
          title="2. Time & Date"
          description="Choose when it happens"
        />

        <WorkflowStep
          icon={CheckCircle2}
          title="3. Publish"
          description="Make it available to students"
        />
      </div>

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <main>
          <ScheduleForm
            submitLabel="Create Schedule"
            onSubmit={handleCreateSchedule}
            onCancel={handleCancel}
          />
        </main>

        {/* =================================================
            SIDEBAR
        ================================================== */}

        <aside className="space-y-5">
          <ScheduleTips />

          <ScheduleInfo />
        </aside>
      </div>
    </div>
  );
};

/* ============================================================
   WORKFLOW STEP
============================================================ */

const WorkflowStep = ({ icon: Icon, title, description, active = false }) => {
  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        active ? "border-[#B00000]/20 bg-red-50" : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            active ? "bg-[#B00000] text-white" : "bg-gray-100 text-gray-500"
          }`}
        >
          <Icon size={19} />
        </div>

        <div className="min-w-0">
          <p
            className={`text-sm font-bold ${
              active ? "text-[#B00000]" : "text-gray-800"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 text-xs text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   SCHEDULE TIPS
============================================================ */

const ScheduleTips = () => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#1E3A8A]">
          <Info size={19} />
        </div>

        <div>
          <h2 className="text-sm font-bold text-gray-900">Schedule Tips</h2>

          <p className="mt-1 text-xs text-gray-500">Helpful reminders</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <Tip
          icon={CalendarCheck2}
          title="Plan ahead"
          description="Give students enough notice before an upcoming session."
        />

        <Tip
          icon={Clock3}
          title="Check the time"
          description="Make sure the start and end times provide enough time for the session."
        />

        <Tip
          icon={Video}
          title="Online sessions"
          description="Always provide a valid meeting link for virtual classes."
        />

        <Tip
          icon={MapPin}
          title="Physical sessions"
          description="Use a clear classroom, laboratory or venue name."
        />
      </div>
    </section>
  );
};

/* ============================================================
   SCHEDULE INFO
============================================================ */

const ScheduleInfo = () => {
  return (
    <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
      <h2 className="text-sm font-bold text-gray-900">What happens next?</h2>

      <div className="mt-4 space-y-4">
        <InfoStep number="1" text="Your schedule will be saved." />

        <InfoStep number="2" text="It will appear on your Schedules page." />

        <InfoStep number="3" text="Students can see the session information." />
      </div>
    </section>
  );
};

const Tip = ({ icon: Icon, title, description }) => {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
        <Icon size={15} />
      </div>

      <div>
        <p className="text-xs font-bold text-gray-800">{title}</p>

        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>
    </div>
  );
};

const InfoStep = ({ number, text }) => {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#1E3A8A] text-[10px] font-bold text-white">
        {number}
      </div>

      <p className="pt-0.5 text-xs leading-5 text-gray-600">{text}</p>
    </div>
  );
};

export default CreateSchedule;
