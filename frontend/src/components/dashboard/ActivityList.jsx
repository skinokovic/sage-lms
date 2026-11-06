import {
  CheckCircle2,
  FileText,
  UserPlus,
  BookOpen,
  Award,
  Clock3,
} from "lucide-react";

const iconMap = {
  enrollment: UserPlus,
  course: BookOpen,
  assignment: FileText,
  completion: CheckCircle2,
  certificate: Award,
};

const ActivityList = ({ activities = [] }) => {
  return (
    <div className="space-y-1">
      {activities.map((activity, index) => {
        const Icon = iconMap[activity.type] || Clock3;

        return (
          <div
            key={activity.id || index}
            className="flex items-start gap-3 rounded-xl p-3 transition hover:bg-gray-50"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-secondary">
              <Icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800">
                {activity.title}
              </p>

              {activity.description && (
                <p className="mt-0.5 text-xs text-gray-500">
                  {activity.description}
                </p>
              )}

              {activity.time && (
                <p className="mt-1 text-[11px] text-gray-400">
                  {activity.time}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityList;
