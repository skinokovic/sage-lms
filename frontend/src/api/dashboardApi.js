import axiosClient from "./axiosClient";

export const dashboardApi = {
  getDashboard: (months = 6) =>
    axiosClient.get("/admin/dashboard", { params: { months } }),
};
