import axiosClient from "./axiosClient";

export const instructorApi = {
  getInstructors: () => axiosClient.get("/admin/instructors"),

  getInstructor: (id) => axiosClient.get(`/admin/instructors/${id}`),

  createInstructor: (payload) =>
    axiosClient.post("/admin/instructors", payload),

  updateInstructor: (id, payload) =>
    axiosClient.put(`/admin/instructors/${id}`, payload),

  deleteInstructor: (id) => axiosClient.delete(`/admin/instructors/${id}`),

  updateInstructorStatus: (id, status) =>
    axiosClient.patch(`/admin/instructors/${id}/status`, {
      status,
    }),
};
