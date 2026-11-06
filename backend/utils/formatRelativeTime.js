const UNITS = [
  { limit: 60, divisor: 1, unit: "second" },
  { limit: 3600, divisor: 60, unit: "minute" },
  { limit: 86400, divisor: 3600, unit: "hour" },
  { limit: 604800, divisor: 86400, unit: "day" },
  { limit: 2629800, divisor: 604800, unit: "week" },
  { limit: 31557600, divisor: 2629800, unit: "month" },
  { limit: Infinity, divisor: 31557600, unit: "year" },
];

const formatRelativeTime = (date) => {
  if (!date) return "Never logged in";

  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);

  if (seconds < 30) return "Just now";

  const { divisor, unit } = UNITS.find((entry) => seconds < entry.limit);
  const value = Math.floor(seconds / divisor);

  return `${value} ${unit}${value === 1 ? "" : "s"} ago`;
};

export default formatRelativeTime;
