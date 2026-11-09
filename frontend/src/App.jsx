import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";

import Homepage from "./pages/Homepage";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForgotPassword from "./pages/ForgotPassword";
import CourseDetails from "./pages/CourseDetails";
import Courses from "./pages/Courses";
import About from "./pages/About";
import OurInstructors from "./pages/OurInstructors";
import Careers from "./pages/Careers";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import FAQ from "./pages/FAQ";

import AdminLayout from "./layouts/AdminLayout";
import InstructorLayout from "./layouts/InstructorLayout";
import StudentLayout from "./layouts/StudentLayout";

// Admin dashboard pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import Students from "./pages/admin/Students";
import CreateStudent from "./pages/admin/CreateStudent";
import Instructors from "./pages/admin/Instructors";
import AdminCourses from "./pages/admin/Courses";
import AdminAssignments from "./pages/admin/Assignments";
import Analytics from "./pages/admin/Analytics";
import Settings from "./pages/admin/Settings";
import AdminEditCourse from "./pages/admin/AdminEditCourse";
import AdminCreateCourse from "./pages/admin/AdminCreateCourse";
import AdminCourseBuilder from "./pages/admin/AdminCourseBuilder";
import AdminCoursePlayer from "./pages/admin/AdminCoursePlayer";
import CreateAssignment from "./pages/admin/CreateAssignment";
import StudentDetails from "./pages/admin/StudentDetails";
import EditStudent from "./pages/admin/EditStudent";
import InstructorsDetails from "./pages/admin/InstructorsDetails";
import InstructorsEdit from "./pages/admin/InstructorsEdit";
import EditAssignment from "./pages/admin/EditAssignment";
import AssignmentDetails from "./pages/admin/AssignmentDetails";
import Subscribers from "./pages/admin/Subscribers";
import ContactMessages from "./pages/admin/ContactMessages";
import AdminReviews from "./pages/admin/Reviews";

// Instructor dashboard pages
import InstructorDashboard from "./pages/instructor/InstructorDashboard";
import InstructorMyCourses from "./pages/instructor/MyCourses";
import InstructorStudents from "./pages/instructor/Students";
import InstructorAssignments from "./pages/instructor/Assignments";
import InstructorSubmissions from "./pages/instructor/Submissions";
import InstructorSchedules from "./pages/instructor/Schedules";
import EditSchedule from "./pages/instructor/EditSchedule";
import InstructorProfile from "./pages/instructor/Profile";
import InstructorCreateCourse from "./pages/instructor/CreateCourse";
import InstructorCourseBuilder from "./pages/instructor/CourseBuilder";
import InstructorEditCourse from "./pages/instructor/EditCourse";
import InstructorCreateAssignment from "./pages/instructor/CreateAssignment";
import InstructorEditAssignment from "./pages/instructor/EditAssignment";
import InstructorReviewSubmission from "./pages/instructor/ReviewSubmission";
import InstructorReviews from "./pages/instructor/Reviews";
// One player for instructors (preview) and students (tracked progress)
import CoursePlayer from "./pages/instructor/CoursePlayer";
import CreateSchedule from "./pages/instructor/CreateSchedule";

// student dashboard pages
import StudentDashboard from "./pages/student/StudentDashboard";
import MyCourses from "./pages/student/MyCourses";
import Assignments from "./pages/student/Assignments";
import StudentAssignmentDetails from "./pages/student/AssignmentDetails";
import Grades from "./pages/student/Grades";
import Certificates from "./pages/student/Certificates";
import CourseLibrary from "./pages/student/CourseLibrary";
import Profile from "./pages/student/Profile";
import VerifyCertificate from "./pages/VerifyCertificate";
import StudentMyReviews from "./pages/student/MyReviews";

import ProtectedRoute from "./routes/ProtectedRoute";
import RoleProtectedRoute from "./routes/RoleProtectedRoute";
import DashboardRedirect from "./routes/DashboardRedirect";

import { initializeAuth } from "./store/authSlice";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Checkout from "./pages/Checkout";
import Cart from "./pages/Cart";
import BecomeInstructor from "./pages/BecomeInstructor";
import InstructorApplications from "./pages/admin/InstructorApplications";
import ChangePassword from "./pages/ChangePassword";
import CreateInstructor from "./pages/admin/CreateInstructor";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import ResetPassword from "./pages/ResetPassword";
import DataDeletion from "./pages/DataDeletion";
import PaymentResult from "./pages/PaymentResult";
import BankTransfers from "./pages/admin/BankTransfer";
import Wishlist from "./pages/WishList";
import GuestRoute from "./routes/GuestRoutes";
import { MotionProvider } from "./components/motion";
import ChatWidget from "./components/assistant/ChatWidget";
import AdminCoupons from "./pages/admin/Coupons";

const App = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <MotionProvider>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Homepage />} />

        {/* <Route path="/login" element={<Login />} />

        <Route path="/create-account" element={<CreateAccount />} />
        <Route path="/forgot-password" element={<ForgotPassword />} /> */}
        <Route path="/courses/:courseId" element={<CourseDetails />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/about" element={<About />} />
        <Route path="/instructors" element={<OurInstructors />} />
        <Route path="/careers" element={<Careers />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/cart" element={<Cart />} />

        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route path="/terms-of-service" element={<TermsOfService />} />
        <Route path="/data-deletion" element={<DataDeletion />} />
        <Route path="/payment/verify" element={<PaymentResult />} />
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:code" element={<VerifyCertificate />} />

        {/* DASHBOARD ENTRY */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* PROTECTED ROUTES */}
        <Route element={<ProtectedRoute />}>
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/become-instructor" element={<BecomeInstructor />} />
          <Route path="/change-password" element={<ChangePassword />} />

          {/* ================= ADMIN ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/dashboard/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />

              {/* Admin coupons */}
              <Route path="coupons" element={<AdminCoupons />} />

              {/* Admin instructor-applications */}
              <Route
                path="instructor-applications"
                element={<InstructorApplications />}
              />

              {/* Admin All students */}
              <Route path="students" element={<Students />} />

              {/* Admin create students */}
              <Route path="students/create" element={<CreateStudent />} />

              {/* Admin All instructor */}
              <Route path="instructors" element={<Instructors />} />

              {/* Admin create instructor */}
              <Route path="instructors/create" element={<CreateInstructor />} />

              {/* Admin All courses */}
              <Route path="courses" element={<AdminCourses />} />

              {/* Admin All Assignments */}
              <Route path="assignments" element={<AdminAssignments />} />

              {/* Admin create Assignments */}
              <Route path="assignments/create" element={<CreateAssignment />} />

              {/* Admin Subscribers*/}
              <Route path="subscribers" element={<Subscribers />} />

              {/* Admin Messages*/}
              <Route path="messages" element={<ContactMessages />} />

              {/* Admin All Analytics */}
              <Route path="analytics" element={<Analytics />} />

              {/* Admin Bank Transfers */}
              <Route path="bank-transfers" element={<BankTransfers />} />

              {/* Admin settings */}
              <Route path="settings" element={<Settings />} />

              {/* Admin create course */}
              <Route path="courses/create" element={<AdminCreateCourse />} />

              {/* Admin create course builder*/}
              <Route
                path="courses/:courseId/builder"
                element={<AdminCourseBuilder />}
              />

              {/* Admin edit course */}
              <Route
                path="courses/:courseId/edit"
                element={<AdminEditCourse />}
              />

              {/* Admin course player*/}
              <Route
                path="courses/:courseId/learn"
                element={<AdminCoursePlayer />}
              />

              <Route path="students/:studentId" element={<StudentDetails />} />
              <Route
                path="students/:studentId/edit"
                element={<EditStudent />}
              />

              <Route path="instructors/:id" element={<InstructorsDetails />} />

              <Route
                path="instructors/:id/edit"
                element={<InstructorsEdit />}
              />

              <Route path="assignments/:id" element={<AssignmentDetails />} />

              <Route path="assignments/:id/edit" element={<EditAssignment />} />

              {/* Admin review*/}
              <Route path="reviews" element={<AdminReviews />} />
            </Route>
          </Route>

          {/* ================= INSTRUCTOR ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["instructor"]} />}>
            <Route path="/dashboard/instructor" element={<InstructorLayout />}>
              <Route index element={<InstructorDashboard />} />

              {/* Instructor myCourses */}
              <Route path="courses" element={<InstructorMyCourses />} />

              {/* Instructor myCourses */}
              <Route path="students" element={<InstructorStudents />} />

              {/* Instructor Assignment */}
              <Route path="assignments" element={<InstructorAssignments />} />

              {/* Instructor Submission */}
              <Route path="submissions" element={<InstructorSubmissions />} />

              {/* Instructor Schedule */}
              <Route path="schedule" element={<InstructorSchedules />} />

              {/* Instructor profile */}
              <Route path="profile" element={<InstructorProfile />} />

              {/* Instructor create course */}
              <Route
                path="courses/create"
                element={<InstructorCreateCourse />}
              />

              {/* Instructor edit course */}
              <Route
                path="schedules/:scheduleId/edit"
                element={<EditSchedule />}
              />

              {/* Instructor create course builder*/}
              <Route
                path="courses/:courseId/builder"
                element={<InstructorCourseBuilder />}
              />

              {/* Instructor edit course */}
              <Route
                path="courses/:courseId/edit"
                element={<InstructorEditCourse />}
              />

              {/* Instructor create assignment */}
              <Route
                path="assignments/create"
                element={<InstructorCreateAssignment />}
              />

              {/* Instructor edit assignment */}
              <Route
                path="assignments/:assignmentId/edit"
                element={<InstructorEditAssignment />}
              />

              {/* Instructor submission review */}
              <Route
                path="submissions/:submissionId/review"
                element={<InstructorReviewSubmission />}
              />

              {/* Instructor course player (preview, progress not saved) */}
              <Route
                path="courses/:courseId/learn"
                element={<CoursePlayer />}
              />

              {/* Instructor create schedule*/}
              <Route path="schedules/create" element={<CreateSchedule />} />

              {/* Instructor reviews*/}
              <Route path="reviews" element={<InstructorReviews />} />
            </Route>
          </Route>
          {/* ================= STUDENT ================= */}
          <Route element={<RoleProtectedRoute allowedRoles={["student"]} />}>
            <Route path="/dashboard/student" element={<StudentLayout />}>
              {/* Student Dashboard */}
              <Route index element={<StudentDashboard />} />

              {/* Student My Courses */}
              <Route path="courses" element={<MyCourses />} />

              {/* Student course player: opened by "Start learning" */}
              <Route
                path="courses/:courseId/learn"
                element={<CoursePlayer />}
              />

              {/* Student My Assignments */}
              <Route path="assignments" element={<Assignments />} />

              {/* Student My Assignments Details */}
              <Route
                path="assignments/:id"
                element={<StudentAssignmentDetails />}
              />

              {/* Student My Grades */}
              <Route path="grades" element={<Grades />} />

              {/* Student My Certificates */}
              <Route path="certificates" element={<Certificates />} />

              {/* Student My Course library */}
              <Route path="library" element={<CourseLibrary />} />

              {/* Student My profile */}
              <Route path="profile" element={<Profile />} />

              {/* Student reviews*/}
              <Route path="reviews" element={<StudentMyReviews />} />
            </Route>
          </Route>
        </Route>

        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        draggable
        theme="light"
      />

      <ChatWidget />
    </MotionProvider>
  );
};

export default App;
