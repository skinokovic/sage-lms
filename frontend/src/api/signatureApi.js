import axiosClient from "./axiosClient";

export const signatureApi = {
  get: () => axiosClient.get("/instructor/signature"),
  save: (formData) =>
    axiosClient.post("/instructor/signature", formData, {
      headers: { "Content-Type": undefined },
    }),
  remove: () => axiosClient.delete("/instructor/signature"),
};
