import DashboardLayout from "./DashboardLayout";

import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Award,
  Library,
  UserCircle,
  Star,
} from "lucide-react";

const buildNavItems = (counts = {}) => [
  {
    label: "Dashboard",
    path: "/dashboard/student",
    icon: LayoutDashboard,
  },
  {
    label: "My Courses",
    path: "/dashboard/student/courses",
    icon: BookOpen,
  },
  {
    label: "Assignments",
    path: "/dashboard/student/assignments",
    icon: ClipboardList,
    badge:
      counts.pendingAssignments > 0
        ? String(counts.pendingAssignments)
        : undefined,
  },
  {
    label: "Grades",
    path: "/dashboard/student/grades",
    icon: GraduationCap,
  },
  {
    label: "Certificates",
    path: "/dashboard/student/certificates",
    icon: Award,
  },
  {
    label: "Course Library",
    path: "/dashboard/student/library",
    icon: Library,
  },
  { label: "My Reviews", path: "/dashboard/student/reviews", icon: Star },
  {
    label: "Profile",
    path: "/dashboard/student/profile",
    icon: UserCircle,
  },
];

const StudentLayout = () => {
  return (
    <DashboardLayout
      navItems={buildNavItems()}
      title="Student Dashboard"
      subtitle="Continue your learning journey"
    />
  );
};

export default StudentLayout;
