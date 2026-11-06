import axiosClient from "./axiosClient";

export const certificatesApi = {
  getMine: () => axiosClient.get("/student/certificates"),
  verify: (code) =>
    axiosClient.get(`/certificates/verify/${encodeURIComponent(code)}`),
};
