import axiosClient from "./axiosClient";

export const studentCoursesApi = {
  getMyCourses: () => axiosClient.get("/student/courses"),
};
