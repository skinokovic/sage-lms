import axiosClient from "./axiosClient";

export const courseApi = {
  create: (payload) => axiosClient.post("/courses", payload),
  mine: (params) => axiosClient.get("/courses/mine", { params }),
  all: (params) => axiosClient.get("/courses", { params }),
  getById: (id) => axiosClient.get(`/courses/${id}`),
  update: (id, payload) => axiosClient.patch(`/courses/${id}`, payload),
  remove: (id) => axiosClient.delete(`/courses/${id}`),

  // Course player: the course plus the caller's progress
  learn: (id) => axiosClient.get(`/courses/${id}/learn`),
  completeLesson: (id, lessonId) =>
    axiosClient.post(`/courses/${id}/lessons/${lessonId}/complete`),

  uploadThumbnail: (id, file) => {
    const formData = new FormData();
    formData.append("image", file);
    return axiosClient.post(`/courses/${id}/thumbnail`, formData, {
      headers: { "Content-Type": undefined },
    });
  },

  uploadVideo: (file) => {
    const formData = new FormData();
    formData.append("video", file);
    return axiosClient.post("/courses/upload/video", formData, {
      headers: { "Content-Type": undefined },
    });
  },
};
