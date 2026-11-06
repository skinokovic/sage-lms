import { useState } from "react";
import { Play, ChevronDown } from "lucide-react";

/**
 * Collapsible curriculum module list for the course details page.
 * `modules`: [{ id, number, title, lessons?: string[] }]
 */
export default function CurriculumAccordion({ modules }) {
  const [openId, setOpenId] = useState(null);

  if (!modules?.length) return null;

  return (
    <div className="flex flex-col gap-3">
      {modules.map((mod) => {
        const isOpen = openId === mod.id;
        return (
          <div
            key={mod.id}
            className="rounded-control border border-line bg-surface"
          >
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : mod.id)}
              aria-expanded={isOpen}
              className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-heading">
                <Play size={14} className="fill-current" />
              </span>
              <span className="flex-1 text-sm">
                <span className="font-semibold text-heading">
                  Module {mod.number}
                </span>
                <span className="ml-2 text-body">{mod.title}</span>
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-body transition-transform ${isOpen ? "rotate-180" : ""}`}
              />
            </button>

            {isOpen && mod.lessons?.length > 0 && (
              <ul className="flex flex-col gap-1.5 border-t border-line px-4 py-3 pl-13 text-sm text-body">
                {mod.lessons.map((lesson, i) => (
                  <li key={i}>{lesson}</li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
