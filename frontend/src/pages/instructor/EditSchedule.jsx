import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarCheck2, Loader2 } from "lucide-react";
import { toast } from "react-toastify";

import ScheduleForm from "../../components/instructor/ScheduleForm";
import { scheduleApi } from "../../api/scheduleApi";
import { toLagosParts } from "../../utils/scheduleFormat";

const EditSchedule = () => {
  const navigate = useNavigate();
  const { scheduleId } = useParams();

  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const goBack = () => navigate("/dashboard/instructor/schedule");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data } = await scheduleApi.get(scheduleId);
      setSchedule(data.schedule);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load this schedule.");
    } finally {
      setLoading(false);
    }
  }, [scheduleId]);

  useEffect(() => {
    load();
  }, [load]);

  // Memoized so the form isn't reset by unrelated re-renders
  const initialData = useMemo(
    () =>
      schedule
        ? {
            title: schedule.title,
            course: schedule.courseId,
            sessionType: schedule.type,
            deliveryMode: schedule.mode,
            location: schedule.location,
            meetingLink: schedule.meetingLink,
            description: schedule.description,
            cancelled: schedule.cancelled,
            date: toLagosParts(schedule.startsAt).date,
            startTime: toLagosParts(schedule.startsAt).time,
            endTime: toLagosParts(schedule.endsAt).time,
          }
        : null,
    [schedule],
  );

  const handleUpdate = async (payload) => {
    try {
      await scheduleApi.update(scheduleId, payload);

      toast.success("Schedule updated successfully.");
      goBack();
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to update schedule. Please try again.",
      );
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={goBack}
          className="mb-4 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-[#B00000]"
        >
          <ArrowLeft size={17} />
          Back to Schedules
        </button>

        <div className="flex items-start gap-3">
          <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#B00000]/10 text-[#B00000] sm:flex">
            <CalendarCheck2 size={24} />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Edit Schedule
            </h1>

            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Update the session details, time or delivery mode.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white py-20 text-sm text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          Loading schedule…
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-gray-200 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#B00000]">
            <AlertCircle size={26} />
          </div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Couldn't load this schedule
          </h3>

          <p className="mt-2 text-sm text-gray-500">{error}</p>

          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={load}
              className="cursor-pointer rounded-xl bg-[#B00000] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
            >
              Try Again
            </button>

            <button
              type="button"
              onClick={goBack}
              className="cursor-pointer rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              Back to Schedules
            </button>
          </div>
        </div>
      ) : (
        <ScheduleForm
          initialData={initialData}
          submitLabel="Save Changes"
          onSubmit={handleUpdate}
          onCancel={goBack}
        />
      )}
    </div>
  );
};

export default EditSchedule;
