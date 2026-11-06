import axiosClient from "./axiosClient";

export const instructorProfileApi = {
  get: () => axiosClient.get("/instructor/profile"),
  update: (payload) => axiosClient.patch("/instructor/profile", payload),
  uploadAvatar: (formData) =>
    axiosClient.patch("/instructor/profile/avatar", formData, {
      headers: { "Content-Type": undefined },
    }),
};
