import axiosClient from "./axiosClient";

export const scheduleApi = {
  list: () => axiosClient.get("/instructor/schedules"),
  get: (id) => axiosClient.get(`/instructor/schedules/${id}`),
  create: (payload) => axiosClient.post("/instructor/schedules", payload),
  update: (id, payload) =>
    axiosClient.patch(`/instructor/schedules/${id}`, payload),
  remove: (id) => axiosClient.delete(`/instructor/schedules/${id}`),
};
