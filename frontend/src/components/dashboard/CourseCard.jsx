import { BookOpen, Clock3, MoreVertical, Users } from "lucide-react";

import ProgressBar from "./ProgressBar";

const CourseCard = ({
  title,
  category,
  instructor,
  students,
  lessons,
  duration,
  progress,
  image,
  status,
  actionLabel = "View course",
}) => {
  return (
    <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-40 overflow-hidden bg-gray-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-linear-to-br from-secondary to-blue-700">
            <BookOpen size={48} className="text-white/80" strokeWidth={1.5} />
          </div>
        )}

        {status && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">
            {status}
          </span>
        )}

        <button
          type="button"
          className="absolute right-3 top-3 rounded-lg bg-white/90 p-2 text-gray-600 shadow-sm backdrop-blur transition hover:bg-white"
        >
          <MoreVertical size={17} />
        </button>
      </div>

      <div className="p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
          {category}
        </p>

        <h3 className="mt-1 line-clamp-2 text-base font-bold text-gray-900">
          {title}
        </h3>

        {instructor && (
          <p className="mt-2 text-xs text-gray-500">Instructor: {instructor}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          {students !== undefined && (
            <span className="flex items-center gap-1.5">
              <Users size={15} />
              {students} students
            </span>
          )}

          {lessons !== undefined && (
            <span className="flex items-center gap-1.5">
              <BookOpen size={15} />
              {lessons} lessons
            </span>
          )}

          {duration && (
            <span className="flex items-center gap-1.5">
              <Clock3 size={15} />
              {duration}
            </span>
          )}
        </div>

        {progress !== undefined && (
          <div className="mt-5">
            <ProgressBar value={progress} label="Your progress" />
          </div>
        )}

        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f0000]"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
