import axiosClient from "./axiosClient";

export const reviewApi = {
  // public
  forCourse: (courseId, params) =>
    axiosClient.get(`/reviews/course/${courseId}`, { params }),
  forInstructor: (instructorId, params) =>
    axiosClient.get(`/reviews/instructor/${instructorId}`, { params }),

  // student
  myForCourse: (courseId) => axiosClient.get(`/reviews/course/${courseId}/me`),
  save: (courseId, payload) =>
    axiosClient.put(`/reviews/course/${courseId}`, payload),
  remove: (courseId) => axiosClient.delete(`/reviews/course/${courseId}`),
  mine: () => axiosClient.get("/reviews/mine"),

  // instructor
  received: (params) => axiosClient.get("/reviews/received", { params }),
};

export const reviewAdminApi = {
  list: (params) => axiosClient.get("/reviews/admin", { params }),
  setStatus: (id, status) =>
    axiosClient.patch(`/reviews/admin/${id}`, { status }),
  remove: (id) => axiosClient.delete(`/reviews/admin/${id}`),
};
