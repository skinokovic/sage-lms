import axiosClient from "./axiosClient";

export const instructorApplicationApi = {
  create: (payload) => axiosClient.post("/instructor-applications", payload),
  mine: () => axiosClient.get("/instructor-applications/me"),
  list: (params = {}) =>
    axiosClient.get("/instructor-applications", { params }),
  getById: (id) => axiosClient.get(`/instructor-applications/${id}`),
  markReviewing: (id) =>
    axiosClient.patch(`/instructor-applications/${id}/review`, {}),
  approve: (id, adminNotes = "") =>
    axiosClient.patch(`/instructor-applications/${id}/approve`, { adminNotes }),
  reject: (id, adminNotes) =>
    axiosClient.patch(`/instructor-applications/${id}/reject`, { adminNotes }),
};
