import DashboardLayout from "./DashboardLayout";

import {
  LayoutDashboard,
  BookOpen,
  Users,
  ClipboardList,
  FileCheck2,
  CalendarDays,
  UserCircle,
  Star,
} from "lucide-react";

const buildNavItems = (counts = {}) => [
  {
    label: "Dashboard",
    path: "/dashboard/instructor",
    icon: LayoutDashboard,
  },
  {
    label: "My Courses",
    path: "/dashboard/instructor/courses",
    icon: BookOpen,
  },
  {
    label: "Students",
    path: "/dashboard/instructor/students",
    icon: Users,
  },
  {
    label: "Assignments",
    path: "/dashboard/instructor/assignments",
    icon: ClipboardList,
  },
  {
    label: "Submissions",
    path: "/dashboard/instructor/submissions",
    icon: FileCheck2,
    badge:
      counts.pendingSubmissions > 0
        ? String(counts.pendingSubmissions)
        : undefined,
  },
  {
    label: "Schedule",
    path: "/dashboard/instructor/schedule",
    icon: CalendarDays,
  },
  { label: "Reviews", path: "/dashboard/instructor/reviews", icon: Star },
  {
    label: "Profile",
    path: "/dashboard/instructor/profile",
    icon: UserCircle,
  },
];

const InstructorLayout = () => {
  return (
    <DashboardLayout
      navItems={buildNavItems()}
      title="Instructor Dashboard"
      subtitle="Manage your courses and students"
    />
  );
};

export default InstructorLayout;
