// Lesson durations are free text ("15 min", "1h 30m", "1 hour", "12:30")
export const parseMinutes = (value) => {
  const text = String(value || "")
    .toLowerCase()
    .trim();
  if (!text) return 0;

  const hours = text.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/);
  const mins = text.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)/);

  if (hours || mins) {
    return Math.round(
      (hours ? parseFloat(hours[1]) * 60 : 0) +
        (mins ? parseFloat(mins[1]) : 0),
    );
  }

  const clock = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (clock) {
    return clock[3]
      ? Math.round(
          Number(clock[1]) * 60 + Number(clock[2]) + Number(clock[3]) / 60,
        )
      : Math.round(Number(clock[1]) + Number(clock[2]) / 60); // mm:ss
  }

  return /^\d+(\.\d+)?$/.test(text) ? Math.round(parseFloat(text)) : 0;
};
