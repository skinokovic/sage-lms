import axiosClient from "./axiosClient";

export const publicApi = {
  instructors: () => axiosClient.get("/public/instructors"),
  subscribe: (email) => axiosClient.post("/subscribers", { email }),
  contact: (payload) => axiosClient.post("/contact", payload),
};
