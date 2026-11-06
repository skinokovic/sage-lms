import axiosClient from "./axiosClient";

export const studentAssignmentsApi = {
  getAll: () => axiosClient.get("/student/assignments"),
  getById: (id) => axiosClient.get(`/student/assignments/${id}`),
  submit: (id, formData) =>
    axiosClient.post(`/student/assignments/${id}/submit`, formData, {
      // Overrides a default JSON content type so axios sends the form as multipart
      headers: { "Content-Type": undefined },
    }),
};
