import axiosClient from "./axiosClient";

export const adminEnrollmentApi = {
  searchStudents: (search) =>
    axiosClient.get("/admin/enrollments/students", { params: { search } }),
  courses: () => axiosClient.get("/admin/enrollments/courses"),
  enroll: (payload) => axiosClient.post("/admin/enrollments", payload),
};
