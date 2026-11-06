const TZ = "Africa/Lagos";

export const formatScheduleDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    timeZone: TZ,
  });

export const formatScheduleDay = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: TZ,
  });

export const formatScheduleTime = (iso) =>
  new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  });

// ISO → { date: "2026-09-28", time: "16:00" } in Nigerian time (for form inputs)
export const toLagosParts = (iso) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));

  const get = (type) => parts.find((part) => part.type === type)?.value || "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${get("hour")}:${get("minute")}`,
  };
};

// "2026-09-28" + "16:00" (Nigerian time) → ISO string
export const lagosToIso = (date, time) =>
  new Date(`${date}T${time}:00+01:00`).toISOString();
