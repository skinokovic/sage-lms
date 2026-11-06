import axiosClient from "./axiosClient";

export const instructorSubmissionApi = {
  list: () => axiosClient.get("/instructor/submissions"),
  get: (id) => axiosClient.get(`/instructor/submissions/${id}`),
  saveNotes: (id, payload) =>
    axiosClient.patch(`/instructor/submissions/${id}/notes`, payload),
  grade: (id, payload) =>
    axiosClient.patch(`/instructor/submissions/${id}/grade`, payload),
  returnForRevision: (id, payload) =>
    axiosClient.patch(`/instructor/submissions/${id}/return`, payload),
};
