import axiosClient from "./axiosClient";

export const assignmentApi = {
  getAssignments: () => axiosClient.get("/admin/assignments"),

  getAssignment: (id) => axiosClient.get(`/admin/assignments/${id}`),

  createAssignment: (payload) =>
    axiosClient.post("/admin/assignments", payload),

  updateAssignment: (id, payload) =>
    axiosClient.put(`/admin/assignments/${id}`, payload),

  deleteAssignment: (id) => axiosClient.delete(`/admin/assignments/${id}`),

  updateAssignmentStatus: (id, status) =>
    axiosClient.patch(`/admin/assignments/${id}/status`, { status }),
};
