import axiosClient from "./axiosClient";

export const analyticsApi = {
  getAnalytics: (range = "30d") =>
    axiosClient.get("/admin/analytics", {
      params: {
        range,
      },
    }),
};
