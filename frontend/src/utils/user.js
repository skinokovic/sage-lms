export function getDisplayName(user) {
  if (!user) return "";
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  return (user.fullName || user.name || fullName || user.email || "").trim();
}

export const getDashboardPath = (user) => {
  if (user?.role === "admin") return "/dashboard/admin";
  if (user?.role === "instructor") return "/dashboard/instructor";
  return "/dashboard/student";
};

// First name only (never falls back to the email address).
export function getFirstName(user) {
  if (!user) return "";
  if (user.firstName) return user.firstName;
  const name = user.fullName || user.name || "";
  return name.trim().split(/\s+/)[0] || "";
}

export function getPhotoUrl(user) {
  return (
    user?.avatarUrl ||
    user?.photoUrl ||
    user?.avatar ||
    user?.profileImage ||
    ""
  );
}

export function getInitialsFromName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function getInitials(user) {
  return getInitialsFromName(getDisplayName(user));
}
