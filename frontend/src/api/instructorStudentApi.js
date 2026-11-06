import axiosClient from "./axiosClient";

export const instructorStudentApi = {
  list: (params) => axiosClient.get("/instructor/students", { params }),
  getById: (id) =>
    axiosClient.get(`/instructor/students/${encodeURIComponent(id)}`),
};
