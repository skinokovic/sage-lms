import axiosClient from "./axiosClient";

export const enrollmentApi = {
  // The logged-in student's enrollments (each one includes its course)
  mine: () => axiosClient.get("/enrollments/me"),

  // Enroll in a FREE course. Paid courses go through checkout instead.
  enroll: (courseId) => axiosClient.post("/enrollments", { courseId }),
};
