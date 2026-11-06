import axiosClient from "./axiosClient";

export const settingsApi = {
  getSettings: () => axiosClient.get("/admin/settings"),

  updateSettings: (payload) => axiosClient.put("/admin/settings", payload),
};
