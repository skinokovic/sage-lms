import axiosClient from "./axiosClient";

export const instructorAssignmentApi = {
  list: () => axiosClient.get("/instructor/assignments"),
  get: (id) => axiosClient.get(`/instructor/assignments/${id}`),
  create: (payload) => axiosClient.post("/instructor/assignments", payload),
  update: (id, payload) =>
    axiosClient.patch(`/instructor/assignments/${id}`, payload),
  setStatus: (id, status) =>
    axiosClient.patch(`/instructor/assignments/${id}/status`, { status }),
  duplicate: (id) =>
    axiosClient.post(`/instructor/assignments/${id}/duplicate`),
  remove: (id) => axiosClient.delete(`/instructor/assignments/${id}`),
};
