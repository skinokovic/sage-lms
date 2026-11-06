import axiosClient from "./axiosClient";

export const studentApi = {
  getAll: () => axiosClient.get("/admin/students"),
  getById: (id) => axiosClient.get(`/admin/students/${id}`),
  update: (id, payload) => axiosClient.patch(`/admin/students/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/students/${id}`),
};
