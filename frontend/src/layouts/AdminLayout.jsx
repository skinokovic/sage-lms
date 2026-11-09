import DashboardLayout from "./DashboardLayout";

import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  UserCheck,
  CreditCard,
  Mail,
  MessageSquare,
  Star,
  Ticket,
} from "lucide-react";

const AdminLayout = () => {
  const navItems = [
    {
      label: "Dashboard",
      path: "/dashboard/admin",
      icon: LayoutDashboard,
      active: true,
    },
    {
      label: "Students",
      path: "/dashboard/admin/students",
      icon: Users,
    },
    {
      label: "Instructors",
      path: "/dashboard/admin/instructors",
      icon: GraduationCap,
    },
    {
      label: "Instructor Applications",
      path: "/dashboard/admin/instructor-applications",
      icon: UserCheck,
    },
    {
      label: "Courses",
      path: "/dashboard/admin/courses",
      icon: BookOpen,
    },
    { label: "Coupons", path: "/dashboard/admin/coupons", icon: Ticket },
    {
      label: "Assignments",
      path: "/dashboard/admin/assignments",
      icon: ClipboardList,
    },
    { label: "Subscribers", path: "/dashboard/admin/subscribers", icon: Mail },
    {
      label: "Messages",
      path: "/dashboard/admin/messages",
      icon: MessageSquare,
    },
    {
      label: "Analytics",
      path: "/dashboard/admin/analytics",
      icon: BarChart3,
    },
    { label: "Reviews", path: "/dashboard/admin/reviews", icon: Star },
    {
      label: "Bank Transfers",
      path: "/dashboard/admin/bank-transfers",
      icon: CreditCard,
    },
    {
      label: "Settings",
      path: "/dashboard/admin/settings",
      icon: Settings,
    },
  ];

  return (
    <DashboardLayout
      navItems={navItems}
      title="Admin Dashboard"
      subtitle="Manage your learning platform"
    />
  );
};

export default AdminLayout;
