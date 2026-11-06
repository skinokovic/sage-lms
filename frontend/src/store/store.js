import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./authSlice";
import coursesReducer from "./courseSlice";
import adminStudentsReducer from "./adminStudentSlice";
import instructorReducer from "./instructorSlice";
import assignmentReducer from "./assignmentSlice";
import analyticsReducer from "./analyticsSlice";
import dashboardReducer from "./dashboardSlice";
import studentCoursesReducer from "./studentCourseSlice";
import studentAssignmentsReducer from "./studentAssignmentSlice";
import studentGradesReducer from "./studentGradeSlice";
import studentCertificatesReducer from "./studentCertificateSlice";
import instructorProfileReducer from "./instructorProfileSlice";

import studentLibraryReducer from "./studentLibrarySlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    adminStudents: adminStudentsReducer,
    instructors: instructorReducer,
    assignments: assignmentReducer,
    analytics: analyticsReducer,
    dashboard: dashboardReducer,
    studentCourses: studentCoursesReducer,
    studentAssignments: studentAssignmentsReducer,
    studentGrades: studentGradesReducer,
    studentCertificates: studentCertificatesReducer,
    instructorProfile: instructorProfileReducer,
    studentLibrary: studentLibraryReducer,
  },
});
